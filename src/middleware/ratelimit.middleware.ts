import type { Request, Response, NextFunction } from "express";
import { ratelimit } from "../lib/ratelimit";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.path === "/health" || req.path === "/health/") {
    next();
    return;
  }

  const ip = clientIp(req);
  const path = req.originalUrl || req.path;
  const sensitive =
    path.includes("/auth/login") ||
    path.includes("/auth/register") ||
    path.includes("/auth/forgot");

  const result = await ratelimit(ip, path, undefined, sensitive);

  if (result.headers) {
    for (const [k, v] of Object.entries(result.headers)) {
      res.setHeader(k, v);
    }
  }

  if (!result.success) {
    res.status(result.statusCode).json(result.body);
    return;
  }

  next();
}
