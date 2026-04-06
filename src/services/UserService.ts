import { prisma } from "../lib/prisma";
import { User, UserRole } from "@prisma/client";
import type { UpdateProfileInput } from "../lib/validators/profile";

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

  /** Hồ sơ đọc được (không trả password) — merchant / profile UI. */
  static async getProfileById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        bio: true,
        avatarUrl: true,
        avatarPublicId: true,
        role: true,
        points: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
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
    // Basic implementation for now (can be optimized with PostGIS later)
    return prisma.user.findMany({
      where: {
        role: UserRole.DONOR,
      },
    });
  }

  static async toggleMerchantRole(userId: string, registerAsMerchant: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("Không tìm thấy người dùng.");
    }
    if (user.role === UserRole.ADMIN) {
      throw new Error("Tài khoản quản trị không đổi vai trò qua luồng này.");
    }
    const newRole = registerAsMerchant ? UserRole.DONOR : UserRole.RECEIVER;
    return prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const phone =
      data.phone === undefined || data.phone === ""
        ? null
        : data.phone.trim();

    const base = {
      name: data.name.trim(),
      phone,
      address: data.address?.trim() || null,
      bio: data.bio?.trim() || null,
    };

    if (data.removeAvatar) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          ...base,
          avatarUrl: null,
          avatarPublicId: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          bio: true,
          avatarUrl: true,
          avatarPublicId: true,
          role: true,
        },
      });
    }

    if (data.avatarUrl !== undefined || data.avatarPublicId !== undefined) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          ...base,
          avatarUrl: data.avatarUrl ?? null,
          avatarPublicId: data.avatarPublicId ?? null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          bio: true,
          avatarUrl: true,
          avatarPublicId: true,
          role: true,
        },
      });
    }

    return prisma.user.update({
      where: { id: userId },
      data: base,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        bio: true,
        avatarUrl: true,
        avatarPublicId: true,
        role: true,
      },
    });
  }
}
