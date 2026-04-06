import type { DonationStatus } from "@prisma/client";
import { FoodStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ReservationService } from "./ReservationService";
import { generateSecureQRToken } from "../lib/qr";

export class DonationService {
  static async createDonation(payload: any, userId: string) {
    if (payload.holdId) {
      const ok = await ReservationService.validateAndConsumeHold(
        payload.holdId,
        userId,
        payload.postId,
        payload.quantity
      );
      if (!ok) {
        throw new Error(
          "Giữ chỗ không hợp lệ hoặc đã hết hạn. Vui lòng tải lại trang và thử lại."
        );
      }
    } else {
      const isReserved = await ReservationService.reserveItem(
        payload.postId,
        payload.quantity
      );
      if (!isReserved) {
        throw new Error(
          "Rất tiếc, món ăn này vừa hết hàng hoặc không đủ số lượng."
        );
      }
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
    if (donation.status === "REQUESTED") {
      throw new Error(
        "Đơn chưa được duyệt. Vui lòng bấm «Duyệt đơn» trong Đơn shop trước khi quét QR hoàn tất."
      );
    }
    if (donation.status !== "APPROVED") {
      throw new Error("Chỉ có thể quét QR khi đơn đã được duyệt.");
    }

    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: "COMPLETED",
      },
    });

    return updatedDonation;
  }

  /** Merchant: REQUESTED → APPROVED (chuẩn bị giao / cho phép quét QR hoàn tất). */
  static async approveDonation(donationId: string, merchantId: string) {
    const d = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { post: true },
    });
    if (!d) throw new Error("Không tìm thấy đơn hàng.");
    if (d.post.donorId !== merchantId) {
      throw new Error("Bạn không có quyền duyệt đơn này.");
    }
    if (d.status !== "REQUESTED") {
      throw new Error("Chỉ duyệt được đơn đang chờ shop xác nhận.");
    }
    return prisma.donation.update({
      where: { id: donationId },
      data: { status: "APPROVED" },
    });
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
        status: "COMPLETED",
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

  /**
   * Người nhận hoặc chủ bài (merchant) hủy đơn trước khi hoàn tất; hoàn lại số lượng vào bài đăng.
   */
  static async cancelDonation(donationId: string, userId: string) {
    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.donation.findUnique({
        where: { id: donationId },
        include: { post: true },
      });
      if (!d) throw new Error("Không tìm thấy đơn hàng.");
      const isReceiver = d.receiverId === userId;
      const isMerchant = d.post.donorId === userId;
      if (!isReceiver && !isMerchant) {
        throw new Error("Bạn không có quyền hủy đơn này.");
      }
      if (d.status === "COMPLETED") {
        throw new Error("Đơn đã hoàn tất, không thể hủy.");
      }
      if (d.status === "CANCELLED") {
        throw new Error("Đơn đã được hủy trước đó.");
      }

      await tx.donation.update({
        where: { id: donationId },
        data: { status: "CANCELLED" },
      });

      let post = await tx.foodPost.update({
        where: { id: d.postId },
        data: { quantity: { increment: d.quantity } },
      });

      if (post.quantity > 0 && post.status === FoodStatus.TAKEN) {
        post = await tx.foodPost.update({
          where: { id: d.postId },
          data: { status: FoodStatus.AVAILABLE },
        });
      }

      return { post, postId: d.postId, qty: d.quantity };
    });

    await ReservationService.releaseItem(updated.postId, updated.qty);
    return updated.post;
  }

  static async listMerchantOrders(merchantId: string, status?: DonationStatus) {
    return prisma.donation.findMany({
      where: {
        post: { donorId: merchantId },
        ...(status ? { status } : {}),
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            rescuePrice: true,
            donorId: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
