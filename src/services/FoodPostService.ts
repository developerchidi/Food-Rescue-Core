import { prisma } from "@/lib/prisma";
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
}
