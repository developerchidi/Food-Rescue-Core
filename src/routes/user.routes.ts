import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { MerchantToggleSchema, UpdateProfileSchema } from "../lib/validators/profile";
import { UserService } from "../services/UserService";
import { resolveAuthUserId } from "../lib/authUser";

const router = Router();

router.get("/profile", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }
    const user = await UserService.getProfileById(resolved.userId);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }
    return res.json(user);
  } catch (err: any) {
    console.error("GET_PROFILE_ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

router.patch("/merchant", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }

    const parsed = MerchantToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const updatedUser = await UserService.toggleMerchantRole(
      resolved.userId,
      parsed.data.registerAsMerchant
    );

    return res.json({
      message: "Cập nhật vai trò thành công",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (err: any) {
    console.error("MERCHANT_TOGGLE_ERROR:", err);
    const msg = err.message || "Server error";
    let status = 400;
    if (msg.includes("Không tìm thấy")) {
      status = 404;
    } else if (msg.includes("quản trị")) {
      status = 403;
    }
    return res.status(status).json({ error: msg });
  }
});

router.patch("/profile", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const updatedUser = await UserService.updateProfile(
      resolved.userId,
      parsed.data
    );

    return res.json({
      message: "Cập nhật hồ sơ thành công",
      user: updatedUser,
    });
  } catch (err: any) {
    console.error("UPDATE_PROFILE_ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
