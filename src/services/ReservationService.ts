import { redis } from "@/lib/redis";

export class ReservationService {
  private static getKey(postId: string) {
    return `food:stock:${postId}`;
  }

  /**
   * Reserve an item (decrement stock in Redis).
   * @returns true if reserved successfully, false if out of stock.
   */
  static async reserveItem(postId: string, quantity: number): Promise<boolean> {
    const key = this.getKey(postId);

    // 1. Decrement stock
    const newStock = await redis.decrby(key, quantity);

    // 2. Check if valid
    if (newStock < 0) {
      // Revert if negative
      await redis.incrby(key, quantity);
      return false;
    }

    return true;
  }

  /**
   * Release an item (increment stock in Redis).
   * Used when transaction fails or is cancelled.
   */
  static async releaseItem(postId: string, quantity: number): Promise<void> {
    const key = this.getKey(postId);
    await redis.incrby(key, quantity);
  }

  /**
   * Initialize stock in Redis from DB if it doesn't exist.
   * This should be called when creating a post or periodically.
   * For now, we assume it's set by the creator or on first access (handled elsewhere).
   * Or we can add a helper here.
   */
  static async setInitialStock(postId: string, quantity: number): Promise<void> {
    const key = this.getKey(postId);
    await redis.set(key, quantity);
  }
}
