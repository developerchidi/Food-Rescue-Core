import { PrismaClient, UserRole, FoodStatus, FoodType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Cleanup initial data
  await prisma.donation.deleteMany();
  await prisma.foodPost.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Donor 1
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

  // Create Donor 2
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

  // Create Donor 3 (New)
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

  // Create Receiver
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

  // Create Food Posts for Donor 1
  await prisma.foodPost.create({
    data: {
      donorId: donor1.id,
      title: "Bã mía của Độ",
      description: "Bã mía tươi, thích hợp làm thức ăn gia súc hoặc phân bón hữu cơ.",
      type: FoodType.MYSTERY_BOX,
      originalPrice: 150000,
      rescuePrice: 50000,
      quantity: 5,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: FoodStatus.AVAILABLE,
      imageUrl: "https://hopdungthucan.com/wp-content/uploads/2022/04/ndslv-510x342.jpg",
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
      imageUrl: "https://vcdn1-video.vnecdn.net/2020/05/20/cach-lam-kho-ga-la-chanh-ngon-1589947098.png",
    },
  });

  // Create Food Posts for Donor 2
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
      imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1000&auto=format&fit=crop",
    },
  });

  // Create Food Posts for Donor 3
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
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop",
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
      imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=1000&auto=format&fit=crop",
    },
  });

  console.log("Dữ liệu mẫu đã được tạo thành công!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
