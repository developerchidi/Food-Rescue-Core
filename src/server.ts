import "./lib/load-env";

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

// Phải parse JSON trước khi log / đọc req.body (nếu không body luôn {}).
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const safeBody = { ...(req.body as Record<string, unknown>) };
    if ("password" in safeBody) safeBody.password = "***";
    console.log(`[REQUEST BODY] ${JSON.stringify(safeBody, null, 2)}`);
  }
  next();
});
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
