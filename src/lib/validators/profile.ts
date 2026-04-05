import { z } from "zod";

/** Toggle DONOR (merchant) / RECEIVER từ profile — đồng bộ field registerAsMerchant với đăng ký. */
export const MerchantToggleSchema = z.object({
  registerAsMerchant: z.boolean(),
});

export type MerchantToggleInput = z.infer<typeof MerchantToggleSchema>;

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, {
      message: "Họ tên phải có ít nhất 2 ký tự.",
    })
    .max(100, {
      message: "Họ tên không được vượt quá 100 ký tự.",
    }),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)(\d{9})$/, {
      message: "Số điện thoại không hợp lệ.",
    })
    .optional(),
  address: z
    .string()
    .trim()
    .max(255, {
      message: "Địa chỉ không được vượt quá 255 ký tự.",
    })
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, {
      message: "Giới thiệu không được vượt quá 500 ký tự.",
    })
    .optional(),
  avatarBase64: z
    .string()
    .trim()
    .refine((value) => value.startsWith("data:image/"), {
      message: "Dữ liệu avatar không hợp lệ.",
    })
    .optional(),
  currentAvatarPublicId: z.string().trim().optional(),
  removeAvatar: z.boolean().optional().default(false),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
