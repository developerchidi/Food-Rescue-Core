import { z } from "zod";

export const FoodTypeSchema = z.enum(["INDIVIDUAL", "MYSTERY_BOX"]);

export const CreateFoodPostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Tên món ăn phải có ít nhất 5 ký tự.")
      .max(100, "Tên món ăn không được quá 100 ký tự."),
    description: z.string().trim().optional(),
    type: FoodTypeSchema.default("INDIVIDUAL"),
    originalPrice: z.coerce
      .number()
      .min(0, "Giá không được âm.")
      .optional(),
    rescuePrice: z.coerce
      .number()
      .min(0, "Giá không được âm.")
      .optional(),
    quantity: z.coerce
      .number()
      .int("Số lượng phải là số nguyên.")
      .min(1, "Số lượng ít nhất là 1."),
    expiryDate: z.coerce.date().refine((date) => date > new Date(), {
      message: "Thời gian hết hạn phải lớn hơn thời gian hiện tại.",
    }),
    imageUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate: Giá giải cứu phải nhỏ hơn giá gốc (nếu cả 2 đều có)
    if (
      data.originalPrice != null &&
      data.rescuePrice != null &&
      data.rescuePrice >= data.originalPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rescuePrice"],
        message: "Giá giải cứu phải nhỏ hơn giá gốc.",
      });
    }
  });

export type CreateFoodPostInput = z.infer<typeof CreateFoodPostSchema>;
