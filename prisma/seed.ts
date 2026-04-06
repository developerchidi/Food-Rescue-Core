import { randomUUID } from "crypto";
import "../src/lib/load-env";
import {
  PrismaClient,
  UserRole,
  FoodStatus,
  FoodType,
  DonationStatus,
  FulfillmentMethod,
} from "@prisma/client";
import bcrypt from "bcryptjs";

/** Pooler (Supabase/PgBouncer) thường gây lỗi prepared statement — ưu tiên DIRECT_URL hoặc ?pgbouncer=true. */
function databaseUrlForSeed(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return direct;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "Thiếu DATABASE_URL. Tạo .env ở thư mục gốc repo hoặc Backend/ (xem .env.example)."
    );
  }
  if (url.includes("pgbouncer=true")) return url;
  if (/pooler\.|supabase\.co|neon\.tech|pgbouncer/i.test(url)) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}pgbouncer=true`;
  }
  return url;
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrlForSeed() } },
});

const SEED_USER_EMAILS = new Set([
  "donor@example.com",
  "vietkitchen@example.com",
  "tiembanh@example.com",
  "receiver@example.com",
  "admin@example.com",
]);

/**
 * Mật khẩu đăng nhập cho mọi user seed (*@example.com): password123
 * Nếu có ADMIN_EMAIL trong .env và email không trùng tài khoản mẫu: tạo thêm user ADMIN
 * với mật khẩu SEED_ADMIN_PASSWORD (mặc định password123).
 * (Khác với bảng QA manual test-data.md dùng *.foodrescue.test + Test@1234 — tài khoản đó tự tạo qua register.)
 */
async function main() {
  await prisma.donation.deleteMany();
  await prisma.foodPost.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  const donor1 = await prisma.user.create({
    data: {
      email: "donor@example.com",
      password: hashedPassword,
      name: "Độ Cao Bò Trắng",
      role: UserRole.DONOR,
      latitude: 10.762622,
      longitude: 106.660172,
    },
  });

  const donor2 = await prisma.user.create({
    data: {
      email: "vietkitchen@example.com",
      password: hashedPassword,
      name: "Viet Kitchen",
      role: UserRole.DONOR,
      latitude: 10.771234,
      longitude: 106.698765,
    },
  });

  const donor3 = await prisma.user.create({
    data: {
      email: "tiembanh@example.com",
      password: hashedPassword,
      name: "Tiệm Bánh Mật Ngọt",
      role: UserRole.DONOR,
      latitude: 10.782622,
      longitude: 106.680172,
    },
  });

  const receiver = await prisma.user.create({
    data: {
      email: "receiver@example.com",
      password: hashedPassword,
      name: "Người Giải Cứu",
      role: UserRole.RECEIVER,
      latitude: 10.773599,
      longitude: 106.704753,
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin Seed",
      role: UserRole.ADMIN,
    },
  });

  const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (envAdminEmail?.includes("@") && !SEED_USER_EMAILS.has(envAdminEmail)) {
    const seedAdminPassword =
      process.env.SEED_ADMIN_PASSWORD?.trim() || "password123";
    const envAdminHash = await bcrypt.hash(seedAdminPassword, 10);
    await prisma.user.create({
      data: {
        email: envAdminEmail,
        password: envAdminHash,
        name: "Quản trị viên",
        role: UserRole.ADMIN,
      },
    });
    console.log(
      `Seed: đã tạo user ADMIN_EMAIL=${envAdminEmail} (đăng nhập bằng mật khẩu SEED_ADMIN_PASSWORD hoặc mặc định "password123").`
    );
  }

  await prisma.foodPost.create({
    data: {
      donorId: donor1.id,
      title: "Bã mía của Độ",
      description:
        "Bã mía tươi, thích hợp làm thức ăn gia súc hoặc phân bón hữu cơ.",
      type: FoodType.MYSTERY_BOX,
      originalPrice: 150000,
      rescuePrice: 50000,
      quantity: 5,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl:
        "https://hopdungthucan.com/wp-content/uploads/2022/04/ndslv-510x342.jpg",
    },
  });

  await prisma.foodPost.create({
    data: {
      donorId: donor1.id,
      title: "Khô gà lá chanh",
      description: "Khô gà nhà làm, đảm bảo vệ sinh. Hộp 500g.",
      type: FoodType.INDIVIDUAL,
      originalPrice: 120000,
      rescuePrice: 45000,
      quantity: 10,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl:
        "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800&auto=format&fit=crop",
    },
  });

  await prisma.foodPost.create({
    data: {
      donorId: donor1.id,
      title: "[Seed] Món đã hết hạn (filter QA)",
      description: "Bài đăng mẫu hết hạn — không hiện marketplace.",
      type: FoodType.INDIVIDUAL,
      originalPrice: 50000,
      rescuePrice: 20000,
      quantity: 0,
      expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: FoodStatus.EXPIRED,
      imageUrl:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200",
    },
  });

  const postStatsPickup = await prisma.foodPost.create({
    data: {
      donorId: donor1.id,
      title: "[Seed] Đơn hoàn thành — pickup",
      description: "Dùng để kiểm tra thống kê merchant.",
      type: FoodType.INDIVIDUAL,
      originalPrice: 80000,
      rescuePrice: 30000,
      quantity: 4,
      expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200",
    },
  });

  await prisma.foodPost.create({
    data: {
      donorId: donor2.id,
      title: "Bánh Mì Thịt Nướng",
      description: "Bánh mì giòn rụm với thịt nướng thơm lừng, còn nóng.",
      type: FoodType.INDIVIDUAL,
      originalPrice: 35000,
      rescuePrice: 12000,
      quantity: 15,
      expiryDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl: "https://nuocmamanchau.com/wp-content/uploads/2025/02/ava-cb72b.jpg",
    },
  });

  await prisma.foodPost.create({
    data: {
      donorId: donor2.id,
      title: "Phở Bò Truyền Thống",
      description: "Nước dùng đậm đà, thịt bò mềm và rau tươi.",
      type: FoodType.INDIVIDUAL,
      originalPrice: 65000,
      rescuePrice: 25000,
      quantity: 8,
      expiryDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl:
        "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1000&auto=format&fit=crop",
    },
  });

  await prisma.foodPost.create({
    data: {
      donorId: donor2.id,
      title: "[Seed] Hết hàng — quantity 0 (QA)",
      description: "Lọc marketplace / trạng thái TAKEN.",
      type: FoodType.INDIVIDUAL,
      originalPrice: 40000,
      rescuePrice: 15000,
      quantity: 0,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: FoodStatus.TAKEN,
      imageUrl:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200",
    },
  });

  const postStatsDelivery = await prisma.foodPost.create({
    data: {
      donorId: donor2.id,
      title: "[Seed] Đơn hoàn thành — delivery",
      description: "Mẫu giao hàng cho seed.",
      type: FoodType.INDIVIDUAL,
      originalPrice: 90000,
      rescuePrice: 40000,
      quantity: 6,
      expiryDate: new Date(Date.now() + 36 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200",
    },
  });

  await prisma.foodPost.create({
    data: {
      donorId: donor3.id,
      title: "Combo Bánh Ngọt Cuối Ngày",
      description: "Hỗn hợp các loại bánh Croissant, Donut và Muffin trong ngày.",
      type: FoodType.MYSTERY_BOX,
      originalPrice: 200000,
      rescuePrice: 60000,
      quantity: 4,
      expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl:
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop",
    },
  });

  await prisma.foodPost.create({
    data: {
      donorId: donor3.id,
      title: "Bánh Kem Trái Cây Mini",
      description: "Bánh kem trái cây tươi, trang trí đẹp mắt.",
      type: FoodType.INDIVIDUAL,
      originalPrice: 85000,
      rescuePrice: 35000,
      quantity: 3,
      expiryDate: new Date(Date.now() + 10 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl:
        "https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=1000&auto=format&fit=crop",
    },
  });

  await prisma.donation.create({
    data: {
      postId: postStatsPickup.id,
      receiverId: receiver.id,
      quantity: 2,
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      status: DonationStatus.COMPLETED,
      qrCode: randomUUID(),
    },
  });

  await prisma.donation.create({
    data: {
      postId: postStatsDelivery.id,
      receiverId: receiver.id,
      quantity: 1,
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryAddress: "123 Đường Seed, Q1, TP.HCM",
      deliveryPhone: "0900000001",
      status: DonationStatus.COMPLETED,
      qrCode: randomUUID(),
    },
  });

  await prisma.donation.create({
    data: {
      postId: postStatsPickup.id,
      receiverId: receiver.id,
      quantity: 1,
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      status: DonationStatus.REQUESTED,
      qrCode: randomUUID(),
    },
  });

  console.log(
    "Seed xong. User *@example.com (kể cả admin@example.com): mật khẩu password123."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
