import { z } from "zod";

export const IdSchema = z.string().uuid({
  message: "ID không hợp lệ.",
});

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({
    message: "Email không hợp lệ.",
  });

export const PasswordSchema = z
  .string()
  .min(8, {
    message: "Mật khẩu phải có ít nhất 8 ký tự.",
  });

