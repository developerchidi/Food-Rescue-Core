import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { UpdateProfileSchema } from "../lib/validators/profile";
import { UserService } from "../services/UserService";

const router = Router();

router.patch("/profile", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const updatedUser = await UserService.updateProfile(req.user.id, parsed.data);

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
