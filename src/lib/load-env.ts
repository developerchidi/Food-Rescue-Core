import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

/**
 * Monorepo: nạp .env theo thứ tự, file sau ghi đè file trước.
 * Hỗ trợ đặt toàn bộ biến chung trong Frontend/.env khi chạy API từ thư mục Backend.
 */
export function loadMonorepoEnv(): void {
  const cwd = process.cwd();
  const files = [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, "..", ".env"),
    path.resolve(cwd, "..", "Frontend", ".env"),
    path.resolve(cwd, "Frontend", ".env"),
  ];
  for (const f of files) {
    if (existsSync(f)) {
      dotenv.config({ path: f, override: true });
    }
  }
}

loadMonorepoEnv();
