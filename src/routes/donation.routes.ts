import { Router } from "express";
import { DonationService } from "../services/DonationService";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { RescueSchema } from "../lib/validators/donations";
import { resolveAuthUserId } from "../lib/authUser";

const router = Router();

router.get(
  "/merchant/stats",
  authMiddleware,
  async (req: AuthRequest, res: any) => {
    try {
      const resolved = await resolveAuthUserId(req.user);
      if (!resolved.ok) {
        return res.status(resolved.status).json({ error: resolved.message });
      }
      const stats = await DonationService.getMerchantStats(resolved.userId);
      return res.json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

router.post("/", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const parsed = RescueSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", fieldErrors: parsed.error.flatten().fieldErrors });
    }

    const donation = await DonationService.createDonation(parsed.data, req.user.id);
    return res.json(donation);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post("/qr/verify", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { token } = req.body;
    const donation = await DonationService.verifyQR(token, req.user.id);
    return res.json(donation);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/my-orders", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const orders = await DonationService.getMyOrders(req.user.id);
    return res.json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const id = String(req.params.id);
    const donation = await DonationService.getDonationById(id);
    if (!donation) return res.status(404).json({ error: "Not found" });

    if (
      donation.receiverId !== req.user.id &&
      donation.post.donorId !== req.user.id
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json(donation);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
