import { randomUUID } from "crypto";
import { FoodStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

const HOLD_TTL_SEC = 600;
const HOLD_PREFIX = "food:hold:";

function useMemoryRedis(): boolean {
  return (
    process.env.USE_MEMORY_REDIS === "1" ||
    !process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    !process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

export class ReservationService {
  private static memStock = new Map<string, number>();
  private static memHolds = new Map<
    string,
    { userId: string; postId: string; quantity: number }
  >();
  private static memHoldTimers = new Map<string, NodeJS.Timeout>();

  private static getKey(postId: string) {
    return `food:stock:${postId}`;
  }

  static async setInitialStock(postId: string, quantity: number): Promise<void> {
    if (useMemoryRedis()) {
      this.memStock.set(postId, quantity);
      return;
    }
    const key = this.getKey(postId);
    await redis.set(key, quantity);
  }

  /** Tổng suất đang giữ chỗ trong memory (chưa xác nhận donation). */
  private static memoryHeldQuantity(postId: string): number {
    let sum = 0;
    for (const h of this.memHolds.values()) {
      if (h.postId === postId) sum += h.quantity;
    }
    return sum;
  }

  /**
   * Đồng bộ tồn kho shadow với DB và các hold đang mở (memory).
   * Tránh lệch: Prisma vẫn quantity=1 nhưng mem=0 sau hold cũ / cleanup / React Strict Mode.
   */
  private static async ensureStockFromDb(postId: string): Promise<boolean> {
    const post = await prisma.foodPost.findUnique({
      where: { id: postId },
      select: { quantity: true, status: true },
    });
    if (!post || post.status !== FoodStatus.AVAILABLE || post.quantity < 1) {
      return false;
    }

    if (useMemoryRedis()) {
      const held = this.memoryHeldQuantity(postId);
      const target = post.quantity - held;
      if (target < 0) {
        this.memStock.set(postId, 0);
        return false;
      }
      this.memStock.set(postId, target);
      return true;
    }

    const key = this.getKey(postId);
    const existing = await redis.get(key);
    if (existing !== null && existing !== undefined) return true;

    await this.setInitialStock(postId, post.quantity);
    return true;
  }

  static async reserveItem(postId: string, quantity: number): Promise<boolean> {
    const synced = await this.ensureStockFromDb(postId);
    if (!synced) return false;

    if (useMemoryRedis()) {
      const cur = this.memStock.get(postId);
      if (cur === undefined || cur < quantity) {
        return false;
      }
      this.memStock.set(postId, cur - quantity);
      return true;
    }

    const key = this.getKey(postId);
    const newStock = await redis.decrby(key, quantity);
    if (newStock < 0) {
      await redis.incrby(key, quantity);
      return false;
    }
    return true;
  }

  static async releaseItem(postId: string, quantity: number): Promise<void> {
    if (useMemoryRedis()) {
      const cur = this.memStock.get(postId) ?? 0;
      this.memStock.set(postId, cur + quantity);
      return;
    }
    const key = this.getKey(postId);
    await redis.incrby(key, quantity);
  }

  /**
   * Giữ chỗ checkout: trừ Redis stock + lưu hold có TTL.
   */
  static async createCheckoutHold(
    userId: string,
    postId: string,
    quantity: number
  ): Promise<{ holdId: string; expiresAt: number; ttlSec: number }> {
    const reserved = await this.reserveItem(postId, quantity);
    if (!reserved) {
      throw new Error("Hết hàng hoặc không đủ số lượng.");
    }

    const holdId = randomUUID();
    const expiresAt = Date.now() + HOLD_TTL_SEC * 1000;
    const payload = JSON.stringify({ userId, postId, quantity });

    if (useMemoryRedis()) {
      this.memHolds.set(holdId, { userId, postId, quantity });
      const t = setTimeout(() => {
        void this.releaseHoldById(userId, holdId).catch(() => undefined);
      }, HOLD_TTL_SEC * 1000);
      this.memHoldTimers.set(holdId, t);
      return { holdId, expiresAt, ttlSec: HOLD_TTL_SEC };
    }

    try {
      await redis.set(`${HOLD_PREFIX}${holdId}`, payload, { ex: HOLD_TTL_SEC });
    } catch (e) {
      await this.releaseItem(postId, quantity);
      throw e;
    }

    return { holdId, expiresAt, ttlSec: HOLD_TTL_SEC };
  }

  /** Hủy hold: hoàn stock + xóa key. */
  static async releaseHoldById(userId: string, holdId: string): Promise<void> {
    if (useMemoryRedis()) {
      const t = this.memHoldTimers.get(holdId);
      if (t) {
        clearTimeout(t);
        this.memHoldTimers.delete(holdId);
      }
      const data = this.memHolds.get(holdId);
      if (!data) return;
      if (data.userId !== userId) {
        throw new Error("Không thể hủy giữ chỗ của người khác.");
      }
      this.memHolds.delete(holdId);
      await this.releaseItem(data.postId, data.quantity);
      return;
    }

    const key = `${HOLD_PREFIX}${holdId}`;
    const raw = await redis.get(key);
    if (!raw) return;
    const data = JSON.parse(raw as string) as {
      userId: string;
      postId: string;
      quantity: number;
    };
    if (data.userId !== userId) {
      throw new Error("Không thể hủy giữ chỗ của người khác.");
    }
    await this.releaseItem(data.postId, data.quantity);
    await redis.del(key);
  }

  /**
   * Xác nhận hold khi tạo donation: đúng user/post/qty thì xóa hold (stock đã trừ lúc tạo hold).
   */
  static async validateAndConsumeHold(
    holdId: string,
    userId: string,
    postId: string,
    quantity: number
  ): Promise<boolean> {
    if (useMemoryRedis()) {
      const t = this.memHoldTimers.get(holdId);
      if (t) {
        clearTimeout(t);
        this.memHoldTimers.delete(holdId);
      }
      const data = this.memHolds.get(holdId);
      if (!data) return false;
      if (
        data.userId !== userId ||
        data.postId !== postId ||
        data.quantity !== quantity
      ) {
        return false;
      }
      this.memHolds.delete(holdId);
      return true;
    }

    const key = `${HOLD_PREFIX}${holdId}`;
    const raw = await redis.get(key);
    if (!raw) return false;
    const data = JSON.parse(raw as string) as {
      userId: string;
      postId: string;
      quantity: number;
    };
    if (
      data.userId !== userId ||
      data.postId !== postId ||
      data.quantity !== quantity
    ) {
      return false;
    }
    await redis.del(key);
    return true;
  }
}
