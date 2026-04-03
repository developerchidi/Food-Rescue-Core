import { z } from "zod";

/** Toggle DONOR (merchant) / RECEIVER từ profile — đồng bộ field registerAsMerchant với đăng ký. */
export const MerchantToggleSchema = z.object({
  registerAsMerchant: z.boolean(),
});

export type MerchantToggleInput = z.infer<typeof MerchantToggleSchema>;
