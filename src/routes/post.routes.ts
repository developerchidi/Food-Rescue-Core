import { Router } from 'express';
import { FoodPostService } from '../services/FoodPostService';
import { ReservationService } from '../services/ReservationService';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { CreateFoodPostSchema } from '../lib/validators/posts';

const router = Router();

router.get('/', async (req: any, res: any) => {
  try {
    const posts = await FoodPostService.getAvailablePosts();
    return res.json(posts);
  } catch(err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req: any, res: any) => {
  try {
    const post = await FoodPostService.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    return res.json(post);
  } catch(err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = CreateFoodPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const payload = parsed.data;
    const post = await FoodPostService.createPost({
      donorId: req.user.id,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      originalPrice: payload.originalPrice ?? 0,
      rescuePrice: payload.rescuePrice ?? 0,
      quantity: payload.quantity,
      expiryDate: payload.expiryDate,
      imageUrl: payload.imageUrl,
    });

    await ReservationService.setInitialStock(post.id, post.quantity);

    return res.status(201).json(post);
  } catch (err: any) {
    console.error("CREATE_POST_ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
