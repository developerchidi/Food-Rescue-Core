import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { RegisterSchema } from '../lib/validators/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

router.post('/login', async (req: any, res: any) => {
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
    console.error("LOGIN_ERROR:", err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', async (req: any, res: any) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, registerAsMerchant } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: registerAsMerchant ? UserRole.DONOR : UserRole.RECEIVER,
      },
    });

    return res.status(201).json({
      message: 'Đăng ký thành công',
      userId: user.id,
      role: user.role,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Có lỗi xảy ra trong quá trình đăng ký' });
  }
});

router.post('/logout', (req: any, res: any) => {
  res.clearCookie('token');
  return res.json({ success: true });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
