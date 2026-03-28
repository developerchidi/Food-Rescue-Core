"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { RescueSchema } from "@/lib/validators/donations";

export async function rescueFood(
  postId: string,
  quantity: number,
  fulfillmentMethod: "PICKUP" | "DELIVERY" = "PICKUP",
  address?: string,
  phone?: string
) {
  try {
    const parsed = RescueSchema.parse({
      postId,
      quantity,
      fulfillmentMethod,
      address,
      phone,
    });

    postId = parsed.postId;
    quantity = parsed.quantity;
    fulfillmentMethod = parsed.fulfillmentMethod;
    address = parsed.address;
    phone = parsed.phone;
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: "Dữ liệu không hợp lệ.",
        issues: error.issues,
      };
    }
    throw error;
  }

  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Bạn cần đăng nhập để thực hiện hành động này." };
  }

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const post = await tx.foodPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new Error("Không tìm thấy bài đăng.");
      }

      if (post.status !== "AVAILABLE" || post.quantity < quantity) {
        throw new Error("Sản phẩm đã hết hoặc không đủ số lượng.");
      }

      const donation = await tx.donation.create({
        data: {
          postId: post.id,
          receiverId: userId,
          quantity,
          fulfillmentMethod,
          deliveryAddress: address,
          deliveryPhone: phone,
          status: "REQUESTED",
          qrCode: `${
            fulfillmentMethod === "DELIVERY" ? "SHIP" : "REC"
          }-${post.id.slice(0, 4)}-${userId.slice(0, 4)}-${Date.now()
            .toString()
            .slice(-6)}`,
        },
      });

      const newQuantity = post.quantity - quantity;
      await tx.foodPost.update({
        where: { id: postId },
        data: {
          quantity: newQuantity,
          status: newQuantity === 0 ? "TAKEN" : "AVAILABLE",
        },
      });

      return donation;
    });

    revalidatePath("/marketplace");
    return { success: true, donationId: result.id };
  } catch (error: any) {
    return { error: error.message || "Đã xảy ra lỗi khi xử lý yêu cầu." };
  }
}