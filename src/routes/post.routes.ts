import { Router } from "express";
import { FoodStatus } from "@prisma/client";
import { FoodPostService } from "../services/FoodPostService";
import { ReservationService } from "../services/ReservationService";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import {
  CreateFoodPostSchema,
  UpdateFoodPostSchema,
} from "../lib/validators/posts";
import { resolveAuthUserId } from "../lib/authUser";

const router = Router();

router.get("/", async (req: any, res: any) => {
  try {
    const posts = await FoodPostService.getAvailablePosts();
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/mine", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }
    const posts = await FoodPostService.listPostsByDonor(resolved.userId);
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

/** Công khai — phải khai báo trước GET /:id để không coi "shop" là post id. */
router.get("/shop/:donorId", async (req: any, res: any) => {
  try {
    const data = await FoodPostService.getPublicShopByDonorId(
      String(req.params.donorId)
    );
    if (!data) return res.status(404).json({ error: "Not found" });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req: any, res: any) => {
  try {
    const post = await FoodPostService.getPostById(String(req.params.id));
    if (!post) return res.status(404).json({ error: "Not found" });
    return res.json(post);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }

    const { donorId: _donorFromBodyIgnored, ...bodyForZod } = req.body ?? {};
    const parsed = CreateFoodPostSchema.safeParse(bodyForZod);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const p = parsed.data;
    const post = await FoodPostService.createPost({
      donorId: resolved.userId,
      title: p.title,
      description: p.description,
      type: p.type,
      originalPrice: p.originalPrice ?? 0,
      rescuePrice: p.rescuePrice ?? 0,
      quantity: p.quantity,
      expiryDate: p.expiryDate,
      imageUrl: p.imageUrl,
    });

    await ReservationService.setInitialStock(post.id, post.quantity);

    return res.status(201).json(post);
  } catch (err: any) {
    console.error("CREATE_POST_ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

router.patch("/:id", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }

    const parsed = UpdateFoodPostSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const postId = String(req.params.id);
    const existing = await FoodPostService.getPostById(postId);
    if (!existing || existing.donorId !== resolved.userId) {
      return res.status(404).json({ error: "Không tìm thấy bài đăng." });
    }

    const p = parsed.data;
    const nextOriginal =
      p.originalPrice !== undefined ? p.originalPrice : existing.originalPrice;
    const nextRescue =
      p.rescuePrice !== undefined ? p.rescuePrice : existing.rescuePrice;
    if (
      nextOriginal != null &&
      nextRescue != null &&
      nextRescue >= nextOriginal
    ) {
      return res.status(400).json({
        error: "Giá giải cứu phải nhỏ hơn giá gốc.",
      });
    }

    const updated = await FoodPostService.updatePostByOwner(
      postId,
      resolved.userId,
      {
        title: p.title,
        description: p.description,
        type: p.type,
        originalPrice: p.originalPrice,
        rescuePrice: p.rescuePrice,
        quantity: p.quantity,
        expiryDate: p.expiryDate,
        imageUrl: p.imageUrl,
        status: p.status as FoodStatus | undefined,
      }
    );

    if (!updated) {
      return res.status(404).json({ error: "Không tìm thấy bài đăng." });
    }

    return res.json(updated);
  } catch (err: any) {
    console.error("UPDATE_POST_ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const resolved = await resolveAuthUserId(req.user);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ error: resolved.message });
    }

    const postId = String(req.params.id);
    const ok = await FoodPostService.deletePostByOwner(
      postId,
      resolved.userId
    );
    if (!ok) {
      return res.status(404).json({ error: "Không tìm thấy bài đăng." });
    }
    return res.status(204).send();
  } catch (err: any) {
    console.error("DELETE_POST_ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
