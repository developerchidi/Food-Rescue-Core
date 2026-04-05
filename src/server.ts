import dotenv from 'dotenv';
import path from 'path';

// Load from root .env or current folder .env
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), override: true });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import donationRoutes from './routes/donation.routes';
import contactRoutes from './routes/contact.routes';
import reservationRoutes from './routes/reservation.routes';
import userRoutes from './routes/user.routes';
import morgan from 'morgan';
import { rateLimitMiddleware } from './middleware/ratelimit.middleware';

const app = express();
app.use(morgan('dev')); // Standard HTTP logger

// Custom body logger for better debugging (no emojis)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '***';
    console.log(`[REQUEST BODY] ${JSON.stringify(safeBody, null, 2)}`);
  }
  next();
});

app.use(express.json());
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', credentials: true }));
app.use(cookieParser());

const healthJson = () => ({
  status: 'ok' as const,
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
  service: 'food-rescue-api',
});

app.get('/health', (_req, res) => {
  res.status(200).json(healthJson());
});

// --- ROUTES --- //
app.use('/api', rateLimitMiddleware);
app.get('/api/health', (_req, res) => {
  res.status(200).json(healthJson());
});
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API Server running at http://localhost:${PORT}`);
});
