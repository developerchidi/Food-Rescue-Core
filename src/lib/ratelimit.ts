import { redis } from "./redis";
import { Ratelimit } from "@upstash/ratelimit";

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

type Role = "GUEST" | "RECEIVER" | "DONOR" | "ADMIN";
const getRoleKey = (role?: string): keyof typeof LIMIT_CONFIG => {
  if (role === "ADMIN") return "ADMIN";
  if (role === "RECEIVER" || role === "DONOR") return "USER";
  return "GUEST";
};

const getLimiter = (count: number, window: string) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(count, window as never),
    analytics: true,
    prefix: "@foodrescue/ratelimit",
  });
};

export type RateLimitResult =
  | { success: true; headers?: Record<string, string> }
  | {
      success: false;
      statusCode: number;
      body: Record<string, unknown>;
      headers: Record<string, string>;
    };

export async function ratelimit(
  ip: string,
  path: string,
  role?: string,
  isSensitive: boolean = false
): Promise<RateLimitResult> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { success: true };
  }

  const roleKey = getRoleKey(role);
  const config = isSensitive ? LIMIT_CONFIG[roleKey].SENSITIVE : LIMIT_CONFIG[roleKey].GLOBAL;

  const limiter = getLimiter(config.count, config.window);
  const identifier = `${roleKey}:${isSensitive ? "sen" : "glb"}:${path}:${ip}`;

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    const headers: Record<string, string> = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
      "X-RateLimit-Policy": `${limit};w=${config.window}`,
    };

    if (!success) {
      return {
        success: false,
        statusCode: 429,
        headers,
        body: {
          error: "Too many requests",
          message:
            "Ban da dat gioi han yeu cau cho vai tro cua minh. Vui long quay lai sau.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
      };
    }

    return { success: true, headers };
  } catch (error) {
    console.error("Rate limit system error:", error);
    return { success: true };
  }
}
