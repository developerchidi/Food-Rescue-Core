// Mock cloudinary before import (virtual: true because package is not in Backend deps)
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}), { virtual: true });

import { v2 as cloudinary } from 'cloudinary';
import { uploadImage, deleteImage, getPublicIdFromUrl } from '../../lib/cloudinary';

const mockUpload = cloudinary.uploader.upload as jest.Mock;
const mockDestroy = cloudinary.uploader.destroy as jest.Mock;

describe('Lib - Cloudinary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should return success with url and publicId on successful upload', async () => {
      mockUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'food-rescue/posts/image123',
      });

      const result = await uploadImage('base64data', 'posts');

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://res.cloudinary.com/test/image.jpg');
      expect(result.publicId).toBe('food-rescue/posts/image123');
      expect(mockUpload).toHaveBeenCalledWith('base64data', {
        folder: 'food-rescue/posts',
        resource_type: 'auto',
      });
    });

    it('should return failure on upload error', async () => {
      mockUpload.mockRejectedValue(new Error('Upload failed'));

      const result = await uploadImage('base64data', 'posts');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Không thể tải ảnh lên.');
    });
  });

  describe('deleteImage', () => {
    it('should return success when image is deleted', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' });

      const result = await deleteImage('food-rescue/posts/image123');

      expect(result.success).toBe(true);
      expect(mockDestroy).toHaveBeenCalledWith('food-rescue/posts/image123');
    });

    it('should return failure on delete error', async () => {
      mockDestroy.mockRejectedValue(new Error('Delete failed'));

      const result = await deleteImage('food-rescue/posts/image123');

      expect(result.success).toBe(false);
    });
  });

  describe('getPublicIdFromUrl', () => {
    it('should extract publicId from a cloudinary URL with food-rescue folder', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v123/food-rescue/posts/image123.jpg';
      const publicId = getPublicIdFromUrl(url);
      expect(publicId).toBe('food-rescue/posts/image123');
    });

    it('should extract filename only when URL has no food-rescue folder', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v123/random/image456.png';
      const publicId = getPublicIdFromUrl(url);
      expect(publicId).toBe('image456');
    });

    it('should return null for an invalid URL', () => {
      const publicId = getPublicIdFromUrl('');
      expect(publicId).toBe('');
    });
  });
});
