/**
 * Danh sach cac route cong khai khong can dang nhap
 */
export const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/impact",
  "/partners",
  "/privacy",
  "/terms",
  "/help",
];

/**
 * Danh sach cac route dung de xac thuc
 * Nhung route nay se redirect nguoi dung ve trang chu neu ho da dang nhap
 */
export const authRoutes = [
  "/login",
  "/register",
  "/api/auth/register", // Endpoint dang ky
];

/**
 * Prefix cho cac route API xac thuc
 */
export const apiAuthPrefix = "/api/auth";

/**
 * Redirect mac dinh sau khi dang nhap
 */
export const DEFAULT_LOGIN_REDIRECT = "/";

/**
 * Prefix cho cac route chi danh cho Admin
 */
export const adminRoutesPrefix = "/admin";

/**
 * Prefix cho cac route chi danh cho Merchant (Donor)
 */
export const merchantRoutesPrefix = "/merchant";

/**
 * Danh sach cac API endpoint can ap dung Rate Limiting
 */
export const ratelimitRoutes = [
  "/api/auth/register",
  "/api/auth/callback/credentials", // Mac dinh cua NextAuth
  "/api/contact",
];
