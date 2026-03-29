import { Router } from 'express';
import { FoodPostService } from '../services/FoodPostService';
import { ReservationService } from '../services/ReservationService';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

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
    const postData = { ...req.body, donorId: req.user.id };
    const post = await FoodPostService.createPost(postData);
    
    // Initialize Redis Stock
    await ReservationService.setInitialStock(post.id, post.quantity);
    
    return res.json(post);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
