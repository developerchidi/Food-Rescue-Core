import { prisma } from "../lib/prisma";
import { FoodPost, FoodStatus } from "@prisma/client";

export class FoodPostService {
  static async createPost(data: {
    donorId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    type: "MYSTERY_BOX" | "INDIVIDUAL";
    originalPrice: number;
    rescuePrice: number;
    quantity: number;
    expiryDate: Date;
  }): Promise<FoodPost> {
    return prisma.foodPost.create({
      data: {
        ...data,
        status: FoodStatus.AVAILABLE,
      },
    });
  }

  static async getAvailablePosts() {
    return prisma.foodPost.findMany({
      where: {
        status: FoodStatus.AVAILABLE,
        expiryDate: {
          gt: new Date(),
        },
      },
      include: {
        donor: {
          select: {
            name: true,
            email: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getPostById(id: string) {
    return prisma.foodPost.findUnique({
      where: { id },
      include: { donor: true },
    });
  }

  static async updateStatus(id: string, status: FoodStatus) {
    return prisma.foodPost.update({
      where: { id },
      data: { status },
    });
  }

  static async listPostsByDonor(donorId: string) {
    return prisma.foodPost.findMany({
      where: { donorId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { donations: true } },
      },
    });
  }

  static async updatePostByOwner(
    postId: string,
    donorId: string,
    data: {
      title?: string;
      description?: string | null;
      type?: "MYSTERY_BOX" | "INDIVIDUAL";
      originalPrice?: number | null;
      rescuePrice?: number | null;
      quantity?: number;
      expiryDate?: Date;
      imageUrl?: string | null;
      status?: FoodStatus;
    }
  ) {
    const existing = await prisma.foodPost.findFirst({
      where: { id: postId, donorId },
    });
    if (!existing) return null;

    return prisma.foodPost.update({
      where: { id: postId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.originalPrice !== undefined && { originalPrice: data.originalPrice }),
        ...(data.rescuePrice !== undefined && { rescuePrice: data.rescuePrice }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.expiryDate !== undefined && { expiryDate: data.expiryDate }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  /** Xóa bài và các donation liên quan (chỉ chủ bài). */
  static async deletePostByOwner(postId: string, donorId: string): Promise<boolean> {
    const existing = await prisma.foodPost.findFirst({
      where: { id: postId, donorId },
    });
    if (!existing) return false;

    await prisma.$transaction(async (tx) => {
      await tx.donation.deleteMany({ where: { postId } });
      await tx.foodPost.delete({ where: { id: postId } });
    });
    return true;
  }
}
