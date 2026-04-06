import { prisma } from "./prisma";

type ResolveFailure = { ok: false; status: number; message: string };
type ResolveSuccess = { ok: true; userId: string };

/**
 * Lấy user id từ JWT (field `id` do BE login ký, hoặc `sub` nếu client chuẩn hóa khác)
 * và xác nhận user còn tồn tại trong Prisma — tránh donorId giả từ body hoặc token không khớp DB.
 */
export async function resolveAuthUserId(
  jwtPayload: unknown
): Promise<ResolveSuccess | ResolveFailure> {
  if (!jwtPayload || typeof jwtPayload !== "object") {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  const p = jwtPayload as Record<string, unknown>;
  const raw = p.id ?? p.sub;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { ok: false, status: 401, message: "Invalid token payload" };
  }
  const userId = String(raw);
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  // Sau seed / reset DB, UUID trong JWT cũ không còn trong DB nhưng email vẫn trùng user hiện tại.
  if (!user) {
    const em =
      typeof p.email === "string" ? p.email.trim().toLowerCase() : "";
    if (em.includes("@")) {
      const byEmail = await prisma.user.findUnique({
        where: { email: em },
        select: { id: true },
      });
      if (byEmail) {
        return { ok: true, userId: byEmail.id };
      }
    }
    return {
      ok: false,
      status: 401,
      message:
        "Phiên đăng nhập không khớp tài khoản (thường gặp sau khi reset/seed DB). Hãy đăng xuất và đăng nhập lại.",
    };
  }
  return { ok: true, userId: user.id };
}
