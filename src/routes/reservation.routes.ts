import { Router } from 'express';
import { ReservationService } from '../services/ReservationService';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

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
