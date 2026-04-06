/**
 * Prisma CLI chỉ tự đọc Backend/.env — script này nạp thêm root + Frontend/.env (giống load-env.ts).
 */
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { spawnSync } = require("child_process");

const backendRoot = path.resolve(__dirname, "..");
const files = [
  path.join(backendRoot, ".env"),
  path.join(backendRoot, "..", ".env"),
  path.join(backendRoot, "..", "Frontend", ".env"),
  path.join(backendRoot, "Frontend", ".env"),
];
for (const f of files) {
  if (fs.existsSync(f)) {
    dotenv.config({ path: f, override: true });
  }
}

const args = process.argv.slice(2);
const r = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  cwd: backendRoot,
  shell: true,
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
