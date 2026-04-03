// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    donation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../services/ReservationService', () => ({
  ReservationService: {
    reserveItem: jest.fn(),
    releaseItem: jest.fn(),
  },
}));

jest.mock('../../lib/qr', () => ({
  generateSecureQRToken: jest.fn().mockResolvedValue('FR-TEST1234-abcdef0123456789'),
}));

import { prisma } from '../../lib/prisma';
import { ReservationService } from '../../services/ReservationService';
import { DonationService } from '../../services/DonationService';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockReservation = ReservationService as jest.Mocked<typeof ReservationService>;

describe('Services - DonationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== createDonation ====================
  describe('createDonation', () => {
    const payload = {
      postId: 'post-1',
      quantity: 2,
      fulfillmentMethod: 'PICKUP',
    };
    const userId = 'user-1';

    it('should create donation successfully with QR code and decrement quantity', async () => {
      (mockReservation.reserveItem as jest.Mock).mockResolvedValue(true);

      const mockDonation = {
        id: 'don-1',
        postId: 'post-1',
        receiverId: userId,
        quantity: 2,
        status: 'REQUESTED',
        qrCode: 'FR-TEST1234-abcdef0123456789',
      };

      // Mock $transaction to execute the callback
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: Function) => {
        const tx = {
          foodPost: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'post-1',
              status: 'AVAILABLE',
              expiryDate: new Date(Date.now() + 86400000),
              quantity: 5,
            }),
            update: jest.fn().mockResolvedValue({ id: 'post-1', quantity: 3 }),
          },
          donation: {
            create: jest.fn().mockResolvedValue(mockDonation),
          },
        };
        return cb(tx);
      });

      const result = await DonationService.createDonation(payload, userId);

      expect(mockReservation.reserveItem).toHaveBeenCalledWith('post-1', 2);
      expect(result.qrCode).toBe('FR-TEST1234-abcdef0123456789');
      expect(result.status).toBe('REQUESTED');
    });

    it('should throw when Redis reservation fails (out of stock)', async () => {
      (mockReservation.reserveItem as jest.Mock).mockResolvedValue(false);

      await expect(DonationService.createDonation(payload, userId)).rejects.toThrow(
        'hết hàng'
      );
    });

    it('should throw and rollback Redis when post does not exist', async () => {
      (mockReservation.reserveItem as jest.Mock).mockResolvedValue(true);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: Function) => {
        const tx = {
          foodPost: { findUnique: jest.fn().mockResolvedValue(null) },
          donation: { create: jest.fn() },
        };
        return cb(tx);
      });

      await expect(DonationService.createDonation(payload, userId)).rejects.toThrow();
      expect(mockReservation.releaseItem).toHaveBeenCalledWith('post-1', 2);
    });

    it('should throw and rollback Redis when post is not AVAILABLE', async () => {
      (mockReservation.reserveItem as jest.Mock).mockResolvedValue(true);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: Function) => {
        const tx = {
          foodPost: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'post-1',
              status: 'TAKEN',
              expiryDate: new Date(Date.now() + 86400000),
              quantity: 5,
            }),
          },
          donation: { create: jest.fn() },
        };
        return cb(tx);
      });

      await expect(DonationService.createDonation(payload, userId)).rejects.toThrow(
        'không còn khả dụng'
      );
      expect(mockReservation.releaseItem).toHaveBeenCalled();
    });

    it('should throw and rollback Redis when post is expired', async () => {
      (mockReservation.reserveItem as jest.Mock).mockResolvedValue(true);
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: Function) => {
        const tx = {
          foodPost: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'post-1',
              status: 'AVAILABLE',
              expiryDate: new Date(Date.now() - 86400000), // yesterday
              quantity: 5,
            }),
          },
          donation: { create: jest.fn() },
        };
        return cb(tx);
      });

      await expect(DonationService.createDonation(payload, userId)).rejects.toThrow(
        'hết hạn'
      );
      expect(mockReservation.releaseItem).toHaveBeenCalled();
    });

    it('should auto-set post status to TAKEN when quantity reaches 0', async () => {
      (mockReservation.reserveItem as jest.Mock).mockResolvedValue(true);

      const mockFoodPostUpdate = jest.fn()
        .mockResolvedValueOnce({ id: 'post-1', quantity: 0 })   // decrement result
        .mockResolvedValueOnce({ id: 'post-1', status: 'TAKEN' }); // status update

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: Function) => {
        const tx = {
          foodPost: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'post-1',
              status: 'AVAILABLE',
              expiryDate: new Date(Date.now() + 86400000),
              quantity: 2,
            }),
            update: mockFoodPostUpdate,
          },
          donation: {
            create: jest.fn().mockResolvedValue({ id: 'don-1', status: 'REQUESTED' }),
          },
        };
        return cb(tx);
      });

      await DonationService.createDonation({ ...payload, quantity: 2 }, userId);

      // update called twice: once for decrement, once for status TAKEN
      expect(mockFoodPostUpdate).toHaveBeenCalledTimes(2);
      expect(mockFoodPostUpdate).toHaveBeenLastCalledWith({
        where: { id: 'post-1' },
        data: { status: 'TAKEN' },
      });
    });

    it('should throw "Overselling detected" and rollback Redis when quantity goes negative after DB update', async () => {
      (mockReservation.reserveItem as jest.Mock).mockResolvedValue(true);

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: Function) => {
        const tx = {
          foodPost: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'post-1',
              status: 'AVAILABLE',
              expiryDate: new Date(Date.now() + 86400000),
              quantity: 2,
            }),
            update: jest.fn().mockResolvedValue({ id: 'post-1', quantity: -1 }), // oversold
          },
          donation: {
            create: jest.fn().mockResolvedValue({ id: 'don-1', status: 'REQUESTED', qrCode: 'FR-X-1234567890abcdef' }),
          },
        };
        return cb(tx);
      });

      await expect(DonationService.createDonation(payload, userId)).rejects.toThrow('Overselling detected');
      expect(mockReservation.releaseItem).toHaveBeenCalledWith('post-1', 2);
    });

    it('should throw and rollback Redis when post quantity is insufficient', async () => {
      (mockReservation.reserveItem as jest.Mock).mockResolvedValue(true);

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: Function) => {
        const tx = {
          foodPost: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'post-1',
              status: 'AVAILABLE',
              expiryDate: new Date(Date.now() + 86400000),
              quantity: 1, // only 1 but payload asks for 2
            }),
          },
          donation: { create: jest.fn() },
        };
        return cb(tx);
      });

      await expect(DonationService.createDonation(payload, userId)).rejects.toThrow('không đủ');
      expect(mockReservation.releaseItem).toHaveBeenCalled();
    });
  });

  // ==================== verifyQR ====================
  describe('verifyQR', () => {
    const merchantId = 'donor-1';

    it('should mark donation as COMPLETED on valid QR', async () => {
      (mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue({
        id: 'don-1',
        status: 'REQUESTED',
        post: { donorId: merchantId },
        receiver: { name: 'Customer' },
      });
      (mockPrisma.donation.update as jest.Mock).mockResolvedValue({
        id: 'don-1',
        status: 'COMPLETED',
      });

      const result = await DonationService.verifyQR('FR-VALID-TOKEN1234567890', merchantId);

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw when merchantId does not match donorId', async () => {
      (mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue({
        id: 'don-1',
        status: 'REQUESTED',
        post: { donorId: 'other-donor' },
        receiver: { name: 'Customer' },
      });

      await expect(DonationService.verifyQR('FR-TOKEN-1234567890abcdef', merchantId)).rejects.toThrow(
        'không có quyền'
      );
    });

    it('should throw when donation is already COMPLETED', async () => {
      (mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue({
        id: 'don-1',
        status: 'COMPLETED',
        post: { donorId: merchantId },
        receiver: { name: 'Customer' },
      });

      await expect(DonationService.verifyQR('FR-TOKEN-1234567890abcdef', merchantId)).rejects.toThrow(
        'đã được xác thực'
      );
    });

    it('should throw when donation is CANCELLED', async () => {
      (mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue({
        id: 'don-1',
        status: 'CANCELLED',
        post: { donorId: merchantId },
        receiver: { name: 'Customer' },
      });

      await expect(DonationService.verifyQR('FR-TOKEN-1234567890abcdef', merchantId)).rejects.toThrow(
        'đã bị hủy'
      );
    });
  });

  // ==================== getMyOrders ====================
  describe('getMyOrders', () => {
    it('should query donations by receiverId with includes', async () => {
      const mockOrders = [{ id: 'don-1', post: { donor: { name: 'A' } } }];
      (mockPrisma.donation.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await DonationService.getMyOrders('user-1');

      expect(mockPrisma.donation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { receiverId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  // ==================== getDonationById ====================
  describe('getDonationById', () => {
    it('should query donation by id with post and receiver includes', async () => {
      const mockDonation = { id: 'don-1', post: { donor: {} }, receiver: {} };
      (mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue(mockDonation);

      const result = await DonationService.getDonationById('don-1');

      expect(mockPrisma.donation.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'don-1' },
          include: expect.objectContaining({
            post: expect.any(Object),
            receiver: true,
          }),
        })
      );
      expect(result?.id).toBe('don-1');
    });
  });
});
