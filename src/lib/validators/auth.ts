import { z } from "zod";
import { EmailSchema, PasswordSchema } from "./common";

export const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, {
      message: "Họ tên phải có ít nhất 2 ký tự.",
    }),
  email: EmailSchema,
  password: PasswordSchema,
  /** Đăng ký với vai trò nhà hàng / đối tác (DONOR). Mặc định false = người nhận (RECEIVER). */
  registerAsMerchant: z.boolean().optional().default(false),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export type LoginInput = z.infer<typeof LoginSchema>;

