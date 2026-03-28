import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prisma } from '@/lib/prisma';
import { FoodPostService } from '@/services/FoodPostService';
import { ReservationService } from '@/services/ReservationService';

dotenv.config({ path: '../.env' }); // try resolving from root during dev

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', credentials: true }));
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// --- AUTH MIDDLEWARE --- //
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ROUTES --- //
app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user.id, name: user.name, role: user.role, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7*24*60*60*1000 });
    return res.json({ token, user: payload });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/logout', (req: any, res: any) => {
  res.clearCookie('token');
  return res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, (req: any, res: any) => {
  return res.json({ user: req.user });
});

// --- POST ROUTES --- //
app.get('/api/posts', async (req: any, res: any) => {
  try {
    const posts = await FoodPostService.getAvailablePosts();
    return res.json(posts);
  } catch(err) {
    return res.status(500).json({ error: 'Server error' });
  }
});
app.get('/api/posts/:id', async (req: any, res: any) => {
  try {
    const post = await FoodPostService.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    return res.json(post);
  } catch(err) {
    return res.status(500).json({ error: 'Server error' });
  }
});
app.post('/api/posts', authMiddleware, async (req: any, res: any) => {
  try {
    // Add donorId from auth info
    const postData = { ...req.body, donorId: req.user.id };
    const post = await FoodPostService.createPost(postData);
    
    // Initialize Redis Stock
    await ReservationService.setInitialStock(post.id, post.quantity);
    
    return res.json(post);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- RESERVATION ROUTES --- //
app.post('/api/reservations', authMiddleware, async (req: any, res: any) => {
  try {
    const { postId, quantity } = req.body;
    const reservation = await ReservationService.createReservation(req.user.id, postId, quantity);
    return res.json(reservation);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API Server running at http://localhost:${PORT}`);
});
