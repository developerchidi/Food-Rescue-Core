import { RegisterSchema, LoginSchema } from '../../lib/validators/auth';

describe('Validators - Auth', () => {
  // ==================== RegisterSchema ====================
  describe('RegisterSchema', () => {
    it('should accept valid registration data', () => {
      const result = RegisterSchema.safeParse({
        name: 'Nguyen Van A',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject name with only 1 character', () => {
      const result = RegisterSchema.safeParse({
        name: 'A',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find(i => i.path.includes('name'));
        expect(nameError?.message).toContain('ít nhất 2 ký tự');
      }
    });

    it('should reject missing email', () => {
      const result = RegisterSchema.safeParse({
        name: 'Nguyen Van A',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = RegisterSchema.safeParse({
        name: 'Nguyen Van A',
        email: 'test@example.com',
        password: '123',
      });
      expect(result.success).toBe(false);
    });

    it('should normalize email (trim + lowercase)', () => {
      const result = RegisterSchema.safeParse({
        name: 'Nguyen Van A',
        email: '  Test@GMAIL.com  ',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@gmail.com');
      }
    });
  });

  // ==================== LoginSchema ====================
  describe('LoginSchema', () => {
    it('should accept valid login data', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = LoginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: '1234567',
      });
      expect(result.success).toBe(false);
    });
  });
});
