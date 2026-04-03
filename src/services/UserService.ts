import { prisma } from "../lib/prisma";
import { User, UserRole } from "@prisma/client";

export class UserService {
  static async createUser(data: {
    email: string;
    name?: string;
    role: UserRole;
    latitude?: number;
    longitude?: number;
  }): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async updateUserPoints(id: string, points: number) {
    return prisma.user.update({
      where: { id },
      data: {
        points: {
          increment: points,
        },
      },
    });
  }

  static async getDonorsNear(lat: number, lng: number, radiusKm: number = 10) {
    return prisma.user.findMany({
      where: {
        role: UserRole.DONOR,
      },
    });
  }

  /**
   * Bật/tắt vai trò đối tác (DONOR). RECEIVER ↔ DONOR. Không đổi ADMIN.
   */
  static async toggleMerchantRole(
    userId: string,
    registerAsMerchant: boolean
  ): Promise<User> {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      throw new Error("Không tìm thấy người dùng.");
    }
    if (existing.role === UserRole.ADMIN) {
      throw new Error("Không thể thay đổi vai trò tài khoản quản trị.");
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        role: registerAsMerchant ? UserRole.DONOR : UserRole.RECEIVER,
      },
    });
  }
}
