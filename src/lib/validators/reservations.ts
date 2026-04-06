import { z } from "zod";
import { IdSchema } from "./common";

export const CheckoutHoldCreateSchema = z.object({
  postId: IdSchema,
  quantity: z.coerce.number().int().min(1),
});

export const CheckoutHoldReleaseSchema = z.object({
  holdId: IdSchema,
});
