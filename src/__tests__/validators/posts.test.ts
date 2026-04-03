import { CreateFoodPostSchema, FoodTypeSchema } from '../../lib/validators/posts';

describe('Validators - Posts', () => {
  // ==================== FoodTypeSchema ====================
  describe('FoodTypeSchema', () => {
    it('should accept INDIVIDUAL', () => {
      expect(FoodTypeSchema.safeParse('INDIVIDUAL').success).toBe(true);
    });

    it('should accept MYSTERY_BOX', () => {
      expect(FoodTypeSchema.safeParse('MYSTERY_BOX').success).toBe(true);
    });

    it('should reject invalid type', () => {
      expect(FoodTypeSchema.safeParse('INVALID').success).toBe(false);
    });
  });

  // ==================== CreateFoodPostSchema ====================
  describe('CreateFoodPostSchema', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow

    const validData = {
      title: 'Combo Bun Bo Hue',
      description: 'Mon an ngon',
      type: 'INDIVIDUAL',
      originalPrice: 100000,
      rescuePrice: 50000,
      quantity: 5,
      expiryDate: futureDate,
    };

    it('should accept valid INDIVIDUAL post data', () => {
      const result = CreateFoodPostSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid MYSTERY_BOX post data', () => {
      const result = CreateFoodPostSchema.safeParse({ ...validData, type: 'MYSTERY_BOX' });
      expect(result.success).toBe(true);
    });

    it('should reject title with less than 5 characters', () => {
      const result = CreateFoodPostSchema.safeParse({ ...validData, title: 'Hi' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.issues.find(i => i.path.includes('title'));
        expect(titleError?.message).toContain('ít nhất 5 ký tự');
      }
    });

    it('should reject title with more than 100 characters', () => {
      const result = CreateFoodPostSchema.safeParse({ ...validData, title: 'A'.repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.issues.find(i => i.path.includes('title'));
        expect(titleError?.message).toContain('100');
      }
    });

    it('should reject quantity = 0', () => {
      const result = CreateFoodPostSchema.safeParse({ ...validData, quantity: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer quantity (2.5)', () => {
      const result = CreateFoodPostSchema.safeParse({ ...validData, quantity: 2.5 });
      expect(result.success).toBe(false);
    });

    it('should reject expiryDate in the past', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const result = CreateFoodPostSchema.safeParse({ ...validData, expiryDate: pastDate });
      expect(result.success).toBe(false);
    });

    it('should reject rescuePrice >= originalPrice', () => {
      const result = CreateFoodPostSchema.safeParse({
        ...validData,
        originalPrice: 50000,
        rescuePrice: 50000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const priceError = result.error.issues.find(i => i.path.includes('rescuePrice'));
        expect(priceError?.message).toContain('nhỏ hơn giá gốc');
      }
    });

    it('should accept rescuePrice < originalPrice', () => {
      const result = CreateFoodPostSchema.safeParse({
        ...validData,
        originalPrice: 100000,
        rescuePrice: 30000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative originalPrice', () => {
      const result = CreateFoodPostSchema.safeParse({ ...validData, originalPrice: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid type enum', () => {
      const result = CreateFoodPostSchema.safeParse({ ...validData, type: 'INVALID_TYPE' });
      expect(result.success).toBe(false);
    });

    it('should accept when optional fields are missing', () => {
      const result = CreateFoodPostSchema.safeParse({
        title: 'Combo Bun Bo Hue',
        quantity: 5,
        expiryDate: futureDate,
      });
      expect(result.success).toBe(true);
    });
  });
});
