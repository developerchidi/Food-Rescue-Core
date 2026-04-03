// Mock Redis
jest.mock('../../lib/redis', () => ({
  redis: {
    decrby: jest.fn(),
    incrby: jest.fn(),
    set: jest.fn(),
  },
}));

import { redis } from '../../lib/redis';
import { ReservationService } from '../../services/ReservationService';

const mockRedis = redis as jest.Mocked<typeof redis>;

describe('Services - ReservationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reserveItem', () => {
    it('should return true when stock is sufficient (newStock >= 0)', async () => {
      (mockRedis.decrby as jest.Mock).mockResolvedValue(3); // still 3 left

      const result = await ReservationService.reserveItem('post-1', 2);

      expect(result).toBe(true);
      expect(mockRedis.decrby).toHaveBeenCalledWith('food:stock:post-1', 2);
    });

    it('should return false and revert when stock goes negative', async () => {
      (mockRedis.decrby as jest.Mock).mockResolvedValue(-1); // oversold
      (mockRedis.incrby as jest.Mock).mockResolvedValue(2);

      const result = await ReservationService.reserveItem('post-1', 3);

      expect(result).toBe(false);
      expect(mockRedis.decrby).toHaveBeenCalledWith('food:stock:post-1', 3);
      expect(mockRedis.incrby).toHaveBeenCalledWith('food:stock:post-1', 3);
    });
  });

  describe('releaseItem', () => {
    it('should call redis.incrby with correct key and quantity', async () => {
      (mockRedis.incrby as jest.Mock).mockResolvedValue(5);

      await ReservationService.releaseItem('post-1', 2);

      expect(mockRedis.incrby).toHaveBeenCalledWith('food:stock:post-1', 2);
    });
  });

  describe('setInitialStock', () => {
    it('should call redis.set with correct key and quantity', async () => {
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');

      await ReservationService.setInitialStock('post-1', 10);

      expect(mockRedis.set).toHaveBeenCalledWith('food:stock:post-1', 10);
    });
  });
});
