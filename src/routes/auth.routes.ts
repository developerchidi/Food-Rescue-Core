import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { RegisterSchema } from '../lib/validators/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

router.post('/login', async (req: any, res: any) => {
  try {
    const rawEmail = req.body?.email;
    const password = req.body?.password;
    if (
      rawEmail === undefined ||
      rawEmail === null ||
      password === undefined ||
      password === null ||
      String(rawEmail).trim() === "" ||
      String(password) === ""
    ) {
      return res.status(400).json({
        error: "Thiếu email hoặc mật khẩu. Gửi JSON với header Content-Type: application/json.",
      });
    }

    const email = String(rawEmail).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isValid = await bcrypt.compare(String(password), user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user.id, name: user.name, role: user.role, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7*24*60*60*1000 });
    return res.json({ token, user: payload });
  } catch (err: any) {
    console.error("LOGIN_ERROR:", err);
    const hint =
      process.env.NODE_ENV !== "production" && err?.message
        ? err.message
        : undefined;
    return res.status(500).json({
      error: "Server error",
      ...(hint ? { detail: hint } : {}),
    });
  }
});

router.post('/register', async (req: any, res: any) => {
  try {
    const { name, email, password } = RegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return res.status(201).json({ message: 'Đăng ký thành công', userId: user.id });
  } catch (err: any) {
    if (err.issues) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', issues: err.issues });
    }
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
