import { Router } from "express";
import { ReservationService } from "../services/ReservationService";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { resolveAuthUserId } from "../lib/authUser";
import {
  CheckoutHoldCreateSchema,
  CheckoutHoldReleaseSchema,
} from "../lib/validators/reservations";

const router = Router();

router.post(
  "/checkout-hold/release",
  authMiddleware,
  async (req: AuthRequest, res: any) => {
    try {
      const resolved = await resolveAuthUserId(req.user);
      if (!resolved.ok) {
        return res.status(resolved.status).json({ error: resolved.message });
      }
      const parsed = CheckoutHoldReleaseSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ",
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }
      await ReservationService.releaseHoldById(
        resolved.userId,
        parsed.data.holdId
      );
      return res.json({ ok: true });
    } catch (err: any) {
      const msg = err.message || "Lỗi hủy giữ chỗ";
      const status = msg.includes("Không thể hủy") ? 403 : 400;
      return res.status(status).json({ error: msg });
    }
  }
);

router.post("/checkout-hold", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }
    const parsed = CheckoutHoldCreateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const out = await ReservationService.createCheckoutHold(
      resolved.userId,
      parsed.data.postId,
      parsed.data.quantity
    );
    return res.json(out);
  } catch (err: any) {
    console.error("CHECKOUT_HOLD_ERROR:", err);
    const msg = err.message || "Không thể tạo giữ chỗ";
    const cause = err?.cause ? String(err.cause) : "";
    const blob = `${msg} ${cause}`;
    if (/ENOTFOUND|fetch failed|getaddrinfo|ECONNREFUSED/i.test(blob)) {
      return res.status(503).json({
        error:
          "Không kết nối được Redis (Upstash). Kiểm tra mạng/DNS hoặc thêm USE_MEMORY_REDIS=1 vào .env backend (chỉ dev).",
      });
    }
    return res.status(400).json({ error: msg });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { postId, quantity } = req.body;
    const reserved = await ReservationService.reserveItem(postId, quantity);
    return res.json({ success: reserved });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
