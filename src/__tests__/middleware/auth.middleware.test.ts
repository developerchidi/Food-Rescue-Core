import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware';
import { Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';

// Helper to create mock Express req/res/next
const createMockReqResNext = (overrides: Partial<AuthRequest> = {}) => {
  const req = {
    cookies: {},
    headers: {},
    ...overrides,
  } as AuthRequest;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next };
};

describe('Middleware - Auth', () => {
  const userPayload = { id: 'user-123', name: 'Test User', role: 'RECEIVER', email: 'test@test.com' };

  it('should call next() and set req.user with valid Bearer token', () => {
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
    const { req, res, next } = createMockReqResNext({
      headers: { authorization: `Bearer ${token}` } as any,
    });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-123');
  });

  it('should call next() and set req.user with valid cookie token', () => {
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
    const { req, res, next } = createMockReqResNext({
      cookies: { token },
    } as any);

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('test@test.com');
  });

  it('should return 401 when no token is provided', () => {
    const { req, res, next } = createMockReqResNext();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 401 for expired token', () => {
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '-1s' });
    const { req, res, next } = createMockReqResNext({
      headers: { authorization: `Bearer ${token}` } as any,
    });

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  it('should return 401 for token signed with wrong secret', () => {
    const token = jwt.sign(userPayload, 'wrong-secret', { expiresIn: '1h' });
    const { req, res, next } = createMockReqResNext({
      headers: { authorization: `Bearer ${token}` } as any,
    });

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });
});
