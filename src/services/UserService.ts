import { prisma } from "../lib/prisma";
import { User, UserRole } from "@prisma/client";
import { deleteImage, uploadImage } from "../lib/cloudinary";
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

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    let uploadedPublicId: string | null = null;

    try {
      const data: Record<string, unknown> = {
        name: input.name,
        phone: input.phone,
        address: input.address,
        bio: input.bio,
      };

      if (input.avatarBase64) {
        const uploadedAvatar = await uploadImage(input.avatarBase64, "avatars");
        if (!uploadedAvatar.success || !uploadedAvatar.url || !uploadedAvatar.publicId) {
          throw new Error(uploadedAvatar.error || "Không thể tải avatar lên.");
        }

        uploadedPublicId = uploadedAvatar.publicId;
        data.avatarUrl = uploadedAvatar.url;
        data.avatarPublicId = uploadedAvatar.publicId;

        if (input.currentAvatarPublicId && input.currentAvatarPublicId !== uploadedAvatar.publicId) {
          await deleteImage(input.currentAvatarPublicId);
        }
      } else if (input.removeAvatar) {
        data.avatarUrl = null;
        data.avatarPublicId = null;

        if (input.currentAvatarPublicId) {
          await deleteImage(input.currentAvatarPublicId);
        }
      }

      return prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      if (uploadedPublicId) {
        await deleteImage(uploadedPublicId);
      }
      throw error;
    }
  }
}
