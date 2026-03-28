import { z } from "zod";
import { IdSchema } from "./common";

export const FulfillmentMethodSchema = z.enum(["PICKUP", "DELIVERY"]);

export const RescueSchema = z
  .object({
    postId: IdSchema,
    quantity: z
      .number({
        message: "Số lượng phải là một số.",
      })
      .int("Số lượng phải là số nguyên.")
      .min(1, {
        message: "Số lượng tối thiểu là 1.",
      }),
    fulfillmentMethod: FulfillmentMethodSchema.default("PICKUP"),
    address: z.string().trim().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84)(\d{9})$/, {
        message: "Số điện thoại không hợp lệ.",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentMethod === "DELIVERY") {
      if (!data.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Vui lòng nhập địa chỉ giao hàng.",
        });
      }
      if (!data.phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Vui lòng nhập số điện thoại nhận hàng.",
        });
      }
    }
  });

export type RescueInput = z.infer<typeof RescueSchema>;

