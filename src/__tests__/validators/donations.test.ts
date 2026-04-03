import { RescueSchema, FulfillmentMethodSchema } from '../../lib/validators/donations';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Validators - Donations', () => {
  // ==================== FulfillmentMethodSchema ====================
  describe('FulfillmentMethodSchema', () => {
    it('should accept PICKUP', () => {
      expect(FulfillmentMethodSchema.safeParse('PICKUP').success).toBe(true);
    });

    it('should accept DELIVERY', () => {
      expect(FulfillmentMethodSchema.safeParse('DELIVERY').success).toBe(true);
    });

    it('should reject invalid value', () => {
      expect(FulfillmentMethodSchema.safeParse('INVALID').success).toBe(false);
    });
  });

  // ==================== RescueSchema ====================
  describe('RescueSchema', () => {
    // --- PICKUP cases ---
    it('should accept valid PICKUP data', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 2,
        fulfillmentMethod: 'PICKUP',
      });
      expect(result.success).toBe(true);
    });

    it('should accept PICKUP without address/phone', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1,
        fulfillmentMethod: 'PICKUP',
      });
      expect(result.success).toBe(true);
    });

    // --- DELIVERY cases ---
    it('should accept valid DELIVERY data with address + phone', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1,
        fulfillmentMethod: 'DELIVERY',
        address: '123 Nguyen Hue, Q1, HCM',
        phone: '0912345678',
      });
      expect(result.success).toBe(true);
    });

    it('should reject DELIVERY without address', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1,
        fulfillmentMethod: 'DELIVERY',
        phone: '0912345678',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const addressError = result.error.issues.find(i => i.path.includes('address'));
        expect(addressError?.message).toContain('địa chỉ giao hàng');
      }
    });

    it('should reject DELIVERY without phone', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1,
        fulfillmentMethod: 'DELIVERY',
        address: '123 Nguyen Hue, Q1, HCM',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneError = result.error.issues.find(i => i.path.includes('phone'));
        expect(phoneError?.message).toContain('số điện thoại');
      }
    });

    it('should reject DELIVERY missing both address and phone', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1,
        fulfillmentMethod: 'DELIVERY',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    // --- Phone format ---
    it('should accept phone starting with 0 (0912345678)', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1,
        fulfillmentMethod: 'DELIVERY',
        address: '123 Street',
        phone: '0912345678',
      });
      expect(result.success).toBe(true);
    });

    it('should accept phone starting with +84 (+84912345678)', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1,
        fulfillmentMethod: 'DELIVERY',
        address: '123 Street',
        phone: '+84912345678',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format (123456)', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1,
        fulfillmentMethod: 'DELIVERY',
        address: '123 Street',
        phone: '123456',
      });
      expect(result.success).toBe(false);
    });

    // --- Quantity ---
    it('should reject quantity = 0', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 0,
        fulfillmentMethod: 'PICKUP',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer quantity (1.5)', () => {
      const result = RescueSchema.safeParse({
        postId: VALID_UUID,
        quantity: 1.5,
        fulfillmentMethod: 'PICKUP',
      });
      expect(result.success).toBe(false);
    });

    // --- PostId ---
    it('should reject non-UUID postId', () => {
      const result = RescueSchema.safeParse({
        postId: 'not-a-uuid',
        quantity: 1,
        fulfillmentMethod: 'PICKUP',
      });
      expect(result.success).toBe(false);
    });
  });
});
