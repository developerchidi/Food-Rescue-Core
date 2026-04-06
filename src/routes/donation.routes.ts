import { DonationStatus } from "@prisma/client";
import { Router } from "express";
import { DonationService } from "../services/DonationService";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { RescueSchema } from "../lib/validators/donations";
import { resolveAuthUserId } from "../lib/authUser";

const DONATION_STATUS_VALUES: DonationStatus[] = [
  "REQUESTED",
  "APPROVED",
  "COMPLETED",
  "CANCELLED",
];

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

router.get(
  "/merchant/orders",
  authMiddleware,
  async (req: AuthRequest, res: any) => {
    try {
      const resolved = await resolveAuthUserId(req.user);
      if (!resolved.ok) {
        return res.status(resolved.status).json({ error: resolved.message });
      }
      const raw =
        typeof req.query.status === "string" ? req.query.status.trim() : "";
      const status = DONATION_STATUS_VALUES.includes(raw as DonationStatus)
        ? (raw as DonationStatus)
        : undefined;
      const orders = await DonationService.listMerchantOrders(
        resolved.userId,
        status
      );
      return res.json(orders);
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

    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }

    const donation = await DonationService.createDonation(
      parsed.data,
      resolved.userId
    );
    return res.json(donation);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post("/qr/verify", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }
    const { token } = req.body;
    const donation = await DonationService.verifyQR(token, resolved.userId);
    return res.json(donation);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/my-orders", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }
    const orders = await DonationService.getMyOrders(resolved.userId);
    return res.json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch(
  "/:id/approve",
  authMiddleware,
  async (req: AuthRequest, res: any) => {
    try {
      const resolved = await resolveAuthUserId(req.user);
      if (!resolved.ok) {
        return res.status(resolved.status).json({ error: resolved.message });
      }
      const id = String(req.params.id);
      const donation = await DonationService.approveDonation(
        id,
        resolved.userId
      );
      return res.json(donation);
    } catch (err: any) {
      const msg = err.message || "Không thể duyệt đơn";
      if (msg.includes("Không tìm thấy")) {
        return res.status(404).json({ error: msg });
      }
      if (msg.includes("quyền")) {
        return res.status(403).json({ error: msg });
      }
      return res.status(400).json({ error: msg });
    }
  }
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  async (req: AuthRequest, res: any) => {
    try {
      const resolved = await resolveAuthUserId(req.user);
      if (!resolved.ok) {
        return res.status(resolved.status).json({ error: resolved.message });
      }
      const id = String(req.params.id);
      const post = await DonationService.cancelDonation(id, resolved.userId);
      return res.json({ ok: true, post });
    } catch (err: any) {
      const msg = err.message || "Không thể hủy đơn";
      if (msg.includes("Không tìm thấy")) {
        return res.status(404).json({ error: msg });
      }
      if (msg.includes("quyền")) {
        return res.status(403).json({ error: msg });
      }
      return res.status(400).json({ error: msg });
    }
  }
);

router.get("/:id", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }
    const id = String(req.params.id);
    const donation = await DonationService.getDonationById(id);
    if (!donation) return res.status(404).json({ error: "Not found" });

    if (
      donation.receiverId !== resolved.userId &&
      donation.post.donorId !== resolved.userId
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json({
      ...donation,
      viewerIsReceiver: donation.receiverId === resolved.userId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
