// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';
import { UserService } from '../../services/UserService';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Services - UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should call prisma.user.create with correct data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'RECEIVER' as const,
        latitude: 10.82,
        longitude: 106.63,
      };
      const mockUser = { id: 'user-1', ...userData, password: null, emailVerified: null, points: 0, createdAt: new Date(), updatedAt: new Date() };
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
      expect(result.id).toBe('user-1');
    });
  });

  describe('getUserByEmail', () => {
    it('should call prisma.user.findUnique with email', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUserByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('updateUserPoints', () => {
    it('should call prisma.user.update with increment', async () => {
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1', points: 15 });

      const result = await UserService.updateUserPoints('user-1', 10);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { points: { increment: 10 } },
      });
      expect(result.points).toBe(15);
    });
  });

  describe('getDonorsNear', () => {
    it('should filter users with role DONOR', async () => {
      const mockDonors = [{ id: 'd-1', role: 'DONOR' }];
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockDonors);

      const result = await UserService.getDonorsNear(10.82, 106.63);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'DONOR' },
      });
      expect(result).toHaveLength(1);
    });
  });
});
