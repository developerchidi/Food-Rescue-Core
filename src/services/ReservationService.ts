import { randomUUID } from "crypto";
import { redis } from "../lib/redis";

export type CheckoutHoldResult = {
  holdId: string;
  expiresAt: number;
  ttlSec: number;
};

export class ReservationService {
  private static readonly HOLDS_ZSET = "food:holds:schedule";
  private static readonly HOLD_DATA_PREFIX = "food:hold:data:";

  private static getStockKey(postId: string) {
    return `food:stock:${postId}`;
  }

  /**
   * TTL giữ chỗ (giây): mặc định ngẫu nhiên trong khoảng 5–10 phút.
   * Có thể cố định bằng RESERVATION_HOLD_TTL_SEC.
   */
  private static getHoldTtlSec(): number {
    const fixed = process.env.RESERVATION_HOLD_TTL_SEC;
    if (fixed) {
      const n = Number(fixed);
      if (Number.isFinite(n) && n > 0) {
        return Math.floor(n);
      }
    }
    const min = Number(process.env.RESERVATION_HOLD_MIN_SEC || 300);
    const max = Number(process.env.RESERVATION_HOLD_MAX_SEC || 600);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
      return 600;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /**
   * Giải phóng các hold đã hết hạn (theo score trong ZSET) và trả kho Redis.
   */
  static async cleanupExpiredHolds(): Promise<void> {
    const now = Date.now();
    const expiredIds = await redis.zrange<string[]>(
      this.HOLDS_ZSET,
      "-inf",
      now,
      { byScore: true }
    );
    if (!expiredIds?.length) {
      return;
    }
    for (const holdId of expiredIds) {
      await this.finalizeExpiredHold(holdId);
    }
  }

  private static async finalizeExpiredHold(holdId: string): Promise<void> {
    const key = `${this.HOLD_DATA_PREFIX}${holdId}`;
    const raw = await redis.get(key);
    if (raw) {
      try {
        const data = JSON.parse(String(raw)) as { postId: string; quantity: number };
        await redis.incrby(this.getStockKey(data.postId), data.quantity);
      } catch {
        /* ignore malformed */
      }
      await redis.del(key);
    }
    await redis.zrem(this.HOLDS_ZSET, holdId);
  }

  /**
   * Giữ chỗ checkout: trừ kho ảnh Redis (atomic DECRBY), ghi metadata + lịch hết hạn.
   */
  static async createCheckoutHold(
    postId: string,
    quantity: number,
    userId: string
  ): Promise<CheckoutHoldResult | null> {
    await this.cleanupExpiredHolds();

    const stockKey = this.getStockKey(postId);
    const newStock = await redis.decrby(stockKey, quantity);

    if (newStock < 0) {
      await redis.incrby(stockKey, quantity);
      return null;
    }

    const holdId = randomUUID();
    const ttlSec = this.getHoldTtlSec();
    const expiresAt = Date.now() + ttlSec * 1000;
    const payload = JSON.stringify({ postId, quantity, userId, expiresAt });
    const dataKey = `${this.HOLD_DATA_PREFIX}${holdId}`;

    await redis.set(dataKey, payload);
    await redis.zadd(this.HOLDS_ZSET, { score: expiresAt, member: holdId });

    return { holdId, expiresAt, ttlSec };
  }

  /**
   * Hủy giữ chỗ (người dùng rời trang / đổi số lượng): trả kho Redis.
   */
  static async releaseCheckoutHold(holdId: string, userId: string): Promise<void> {
    await this.cleanupExpiredHolds();

    const key = `${this.HOLD_DATA_PREFIX}${holdId}`;
    const raw = await redis.get(key);
    if (!raw) {
      return;
    }

    let data: { postId: string; quantity: number; userId: string };
    try {
      data = JSON.parse(String(raw)) as { postId: string; quantity: number; userId: string };
    } catch {
      return;
    }

    if (data.userId !== userId) {
      return;
    }

    await redis.incrby(this.getStockKey(data.postId), data.quantity);
    await redis.del(key);
    await redis.zrem(this.HOLDS_ZSET, holdId);
  }

  /**
   * Xác nhận hold hợp lệ trước khi tạo donation: xóa metadata (kho đã trừ lúc giữ chỗ).
   */
  static async validateAndConsumeHold(
    holdId: string,
    userId: string,
    postId: string,
    quantity: number
  ): Promise<boolean> {
    await this.cleanupExpiredHolds();

    const key = `${this.HOLD_DATA_PREFIX}${holdId}`;
    const raw = await redis.get(key);
    if (!raw) {
      return false;
    }

    let data: { postId: string; quantity: number; userId: string; expiresAt: number };
    try {
      data = JSON.parse(String(raw)) as typeof data;
    } catch {
      return false;
    }

    if (data.userId !== userId || data.postId !== postId || data.quantity !== quantity) {
      return false;
    }

    if (Date.now() > data.expiresAt) {
      await this.finalizeExpiredHold(holdId);
      return false;
    }

    await redis.del(key);
    await redis.zrem(this.HOLDS_ZSET, holdId);
    return true;
  }

  /**
   * Reserve trực tiếp (legacy, không TTL) — vẫn dùng khi không có holdId.
   */
  static async reserveItem(postId: string, quantity: number): Promise<boolean> {
    await this.cleanupExpiredHolds();

    const key = this.getStockKey(postId);
    const newStock = await redis.decrby(key, quantity);

    if (newStock < 0) {
      await redis.incrby(key, quantity);
      return false;
    }

    return true;
  }

  static async releaseItem(postId: string, quantity: number): Promise<void> {
    const key = this.getStockKey(postId);
    await redis.incrby(key, quantity);
  }

  static async setInitialStock(postId: string, quantity: number): Promise<void> {
    const key = this.getStockKey(postId);
    await redis.set(key, quantity);
  }
}
