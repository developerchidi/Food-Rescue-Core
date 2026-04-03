// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    foodPost: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';
import { FoodPostService } from '../../services/FoodPostService';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Services - FoodPostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post with status AVAILABLE', async () => {
      const postData = {
        donorId: 'donor-1',
        title: 'Combo Bun Bo',
        type: 'INDIVIDUAL' as const,
        originalPrice: 50000,
        rescuePrice: 25000,
        quantity: 5,
        expiryDate: new Date('2026-12-31'),
      };
      const mockPost = { id: 'post-1', ...postData, status: 'AVAILABLE' };
      (mockPrisma.foodPost.create as jest.Mock).mockResolvedValue(mockPost);

      const result = await FoodPostService.createPost(postData);

      expect(mockPrisma.foodPost.create).toHaveBeenCalledWith({
        data: { ...postData, status: 'AVAILABLE' },
      });
      expect(result.status).toBe('AVAILABLE');
    });
  });

  describe('getAvailablePosts', () => {
    it('should query posts that are AVAILABLE and not expired, include donor', async () => {
      const mockPosts = [{ id: 'post-1', status: 'AVAILABLE', donor: { name: 'A' } }];
      (mockPrisma.foodPost.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const result = await FoodPostService.getAvailablePosts();

      expect(mockPrisma.foodPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'AVAILABLE',
            expiryDate: expect.objectContaining({ gt: expect.any(Date) }),
          }),
          include: expect.objectContaining({
            donor: expect.any(Object),
          }),
          orderBy: { createdAt: 'desc' },
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getPostById', () => {
    it('should return the post when found', async () => {
      const mockPost = { id: 'post-1', title: 'Test' };
      (mockPrisma.foodPost.findUnique as jest.Mock).mockResolvedValue(mockPost);

      const result = await FoodPostService.getPostById('post-1');

      expect(mockPrisma.foodPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        include: { donor: true },
      });
      expect(result?.id).toBe('post-1');
    });

    it('should return null when post not found', async () => {
      (mockPrisma.foodPost.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await FoodPostService.getPostById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should call update with correct id and status', async () => {
      (mockPrisma.foodPost.update as jest.Mock).mockResolvedValue({ id: 'post-1', status: 'TAKEN' });

      const result = await FoodPostService.updateStatus('post-1', 'TAKEN' as any);

      expect(mockPrisma.foodPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: 'TAKEN' },
      });
      expect(result.status).toBe('TAKEN');
    });
  });
});
