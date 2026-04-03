import { IdSchema, EmailSchema, PasswordSchema } from '../../lib/validators/common';

describe('Validators - Common', () => {
  // ==================== IdSchema ====================
  describe('IdSchema', () => {
    it('should accept a valid UUID', () => {
      const result = IdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
      expect(result.success).toBe(true);
    });

    it('should reject a non-UUID string', () => {
      const result = IdSchema.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ID không hợp lệ');
      }
    });
  });

  // ==================== EmailSchema ====================
  describe('EmailSchema', () => {
    it('should accept a valid email and normalize (trim + lowercase)', () => {
      const result = EmailSchema.safeParse('  Test@Gmail.COM  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@gmail.com');
      }
    });

    it('should reject an invalid email format', () => {
      const result = EmailSchema.safeParse('abc');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email không hợp lệ');
      }
    });

    it('should reject an empty string', () => {
      const result = EmailSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  // ==================== PasswordSchema ====================
  describe('PasswordSchema', () => {
    it('should accept a password with 8+ characters', () => {
      const result = PasswordSchema.safeParse('12345678');
      expect(result.success).toBe(true);
    });

    it('should reject a password with 7 characters', () => {
      const result = PasswordSchema.safeParse('1234567');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ít nhất 8 ký tự');
      }
    });

    it('should reject an empty string', () => {
      const result = PasswordSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});
