import { z } from "zod";

export const MerchantToggleSchema = z.object({
  registerAsMerchant: z.boolean(),
});

const phoneRegex = /^(0|\+84)(\d{9})$/;

/** Payload PATCH /users/profile (avatar đã upload qua Cloudinary ở FE). */
export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => v === undefined || v === "" || phoneRegex.test(v), {
      message: "Số điện thoại không hợp lệ.",
    }),
  address: z.string().trim().max(255).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  avatarPublicId: z.string().trim().optional().nullable(),
  removeAvatar: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
