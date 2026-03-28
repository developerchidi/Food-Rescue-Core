import { redis } from "./redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";

// Cau hinh gioi han theo tung vai tro (Priority-aware)
const LIMIT_CONFIG = {
  GUEST: {
    GLOBAL: { count: 30, window: "60 s" },
    SENSITIVE: { count: 5, window: "60 s" },
  },
  USER: {
    GLOBAL: { count: 60, window: "60 s" },
    SENSITIVE: { count: 20, window: "60 s" },
  },
  ADMIN: {
    GLOBAL: { count: 120, window: "60 s" },
    SENSITIVE: { count: 50, window: "60 s" },
  },
};

// Map vai tro tu project sang config
type Role = "GUEST" | "RECEIVER" | "DONOR" | "ADMIN";
const getRoleKey = (role?: string): keyof typeof LIMIT_CONFIG => {
  if (role === "ADMIN") return "ADMIN";
  if (role === "RECEIVER" || role === "DONOR") return "USER";
  return "GUEST";
};

/**
 * Tao limiter dong dua tren tham so (Adaptive)
 */
const getLimiter = (count: number, window: string) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(count, window as any),
    analytics: true,
    prefix: "@foodrescue/ratelimit",
  });
};

export async function ratelimit(ip: string, path: string, role?: string, isSensitive: boolean = false) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { success: true };
  }

  const roleKey = getRoleKey(role);
  const config = isSensitive ? LIMIT_CONFIG[roleKey].SENSITIVE : LIMIT_CONFIG[roleKey].GLOBAL;

  const limiter = getLimiter(config.count, config.window);
  const identifier = `${roleKey}:${isSensitive ? "sen" : "glb"}:${path}:${ip}`;

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
      "X-RateLimit-Policy": `${limit};w=${config.window}`,
    };

    if (!success) {
      return {
        success: false,
        headers,
        response: new NextResponse(
          JSON.stringify({
            error: "Too many requests",
            message: "Ban da dat gioi han yeu cau cho vai tro cua minh. Vui long quay lai sau.",
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
          }
        ),
      };
    }

    return { success: true, headers };
  } catch (error) {
    console.error("Rate limit system error:", error);
    return { success: true };
  }
}
