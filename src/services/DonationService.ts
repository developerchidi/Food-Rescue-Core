import { prisma } from "../lib/prisma";
import { ReservationService } from "./ReservationService";
import { generateSecureQRToken } from "../lib/qr";

export class DonationService {
  static async createDonation(payload: any, userId: string) {
    // 3. Redis Reservation
    const isReserved = await ReservationService.reserveItem(payload.postId, payload.quantity);

    if (!isReserved) {
      throw new Error("Rất tiếc, món ăn này vừa hết hàng hoặc không đủ số lượng.");
    }

    try {
      // 4. DB Transaction
      const result = await prisma.$transaction(async (tx) => {
        const post = await tx.foodPost.findUnique({
          where: { id: payload.postId },
        });

        if (!post) throw new Error("Bài đăng không tồn tại.");
        if (post.status !== "AVAILABLE") throw new Error("Bài đăng không còn khả dụng.");
        if (new Date(post.expiryDate) < new Date()) throw new Error("Bài đăng đã hết hạn.");
        if (post.quantity < payload.quantity) throw new Error("Số lượng trong kho không đủ.");

        // Generate QR Token
        const qrToken = await generateSecureQRToken();

        // Create Donation
        const donation = await tx.donation.create({
          data: {
            postId: payload.postId,
            receiverId: userId,
            quantity: payload.quantity,
            fulfillmentMethod: payload.fulfillmentMethod,
            deliveryAddress: payload.address || null,
            deliveryPhone: payload.phone || null,
            status: "REQUESTED",
            qrCode: qrToken,
          },
        });

        // Update Post Quantity
        const updatedPost = await tx.foodPost.update({
          where: { id: payload.postId },
          data: { quantity: { decrement: payload.quantity } },
        });

        if (updatedPost.quantity < 0) {
          throw new Error("Overselling detected during DB update.");
        }

        // Auto-update status to TAKEN if 0
        if (updatedPost.quantity === 0) {
          await tx.foodPost.update({
            where: { id: payload.postId },
            data: { status: "TAKEN" }
          });
        }

        return donation;
      });

      return result;

    } catch (error: any) {
      // Rollback Redis if DB fails
      console.error("CREATE_DONATION_ERROR:", error);
      await ReservationService.releaseItem(payload.postId, payload.quantity);
      throw new Error(error.message || "Lỗi hệ thống khi tạo đơn hàng.");
    }
  }

  static async verifyQR(token: string, merchantId: string) {
    if (!token) throw new Error("Mã QR không hợp lệ.");

    const donation = await prisma.donation.findUnique({
      where: { qrCode: token },
      include: {
        post: true,
        receiver: true,
      },
    });

    if (!donation) throw new Error("Không tìm thấy đơn hàng tương ứng với mã QR này.");
    if (donation.post.donorId !== merchantId) throw new Error("Bạn không có quyền xác thực đơn hàng này.");
    if (donation.status === "COMPLETED") throw new Error("Đơn hàng này đã được xác thực trước đó.");
    if (donation.status === "CANCELLED") throw new Error("Đơn hàng này đã bị hủy.");

    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: "COMPLETED",
      },
    });

    return updatedDonation;
  }

  static async getMyOrders(userId: string) {
    return prisma.donation.findMany({
      where: {
        receiverId: userId,
      },
      include: {
        post: {
          include: {
            donor: {
              select: {
                name: true,
                email: true,
              }
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getDonationById(id: string) {
    return prisma.donation.findUnique({
      where: { id },
      include: {
        post: {
          include: {
            donor: true,
          },
        },
        receiver: true, // Need receiver to check ownership in frontend or backend
      },
    });
  }

  /** Thống kê merchant: tổng suất đã bán và doanh thu (theo rescuePrice * quantity). */
  static async getMerchantStats(merchantId: string) {
    const donations = await prisma.donation.findMany({
      where: {
        post: { donorId: merchantId },
        status: { not: "CANCELLED" },
      },
      include: {
        post: {
          select: { rescuePrice: true },
        },
      },
    });

    let totalMealsRescued = 0;
    let totalRevenue = 0;
    for (const d of donations) {
      totalMealsRescued += d.quantity;
      const price = d.post.rescuePrice ?? 0;
      totalRevenue += price * d.quantity;
    }

    return {
      totalMealsRescued,
      totalRevenue,
      rating: 0,
    };
  }
}
