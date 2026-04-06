-- Cách đơn giản khi Supabase + pooler làm `migrate deploy` treo / lỗi thiếu cột:
-- Dashboard → SQL Editor → dán toàn bộ file → Run.
-- (Lỗi P2022: column User.phone does not exist.)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarPublicId" TEXT;
