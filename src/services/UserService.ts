import { prisma } from "@/lib/prisma";
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
    // Basic implementation for now (can be optimized with PostGIS later)
    return prisma.user.findMany({
      where: {
        role: UserRole.DONOR,
      },
    });
  }
}
