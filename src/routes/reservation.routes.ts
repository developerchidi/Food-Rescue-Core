import { Router } from 'express';
import { ReservationService } from '../services/ReservationService';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import {
  CheckoutHoldSchema,
  ReleaseCheckoutHoldSchema,
} from '../lib/validators/reservations';

const router = Router();

router.post('/checkout-hold', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const parsed = CheckoutHoldSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await ReservationService.createCheckoutHold(
      parsed.data.postId,
      parsed.data.quantity,
      req.user.id
    );
    if (!result) {
      return res.status(409).json({
        error:
          "Rất tiếc, món ăn này vừa hết hàng hoặc không đủ số lượng.",
      });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/checkout-hold/release', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const parsed = ReleaseCheckoutHoldSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await ReservationService.releaseCheckoutHold(parsed.data.holdId, req.user.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { postId, quantity } = req.body;
    const reserved = await ReservationService.reserveItem(postId, quantity);
    return res.json({ success: reserved });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
