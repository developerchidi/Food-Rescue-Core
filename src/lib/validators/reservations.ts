import { z } from "zod";
import { IdSchema } from "./common";

export const CheckoutHoldSchema = z.object({
  postId: IdSchema,
  quantity: z
    .number({
      message: "Số lượng phải là một số.",
    })
    .int("Số lượng phải là số nguyên.")
    .min(1, {
      message: "Số lượng tối thiểu là 1.",
    }),
});

export type CheckoutHoldInput = z.infer<typeof CheckoutHoldSchema>;

export const ReleaseCheckoutHoldSchema = z.object({
  holdId: IdSchema,
});

export type ReleaseCheckoutHoldInput = z.infer<typeof ReleaseCheckoutHoldSchema>;
