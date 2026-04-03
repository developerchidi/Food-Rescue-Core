import { generateSecureQRToken, isValidQRTokenFormat } from '../../lib/qr';

describe('Lib - QR', () => {
  describe('generateSecureQRToken', () => {
    it('should generate a token matching FR-{BASE36}-{HEX16} format', async () => {
      const token = await generateSecureQRToken();
      expect(token).toMatch(/^FR-[A-Z0-9]+-[0-9a-f]{16}$/);
    });

    it('should generate unique tokens on consecutive calls', async () => {
      const token1 = await generateSecureQRToken();
      const token2 = await generateSecureQRToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('isValidQRTokenFormat', () => {
    it('should return true for a valid token from generateSecureQRToken', async () => {
      const token = await generateSecureQRToken();
      expect(isValidQRTokenFormat(token)).toBe(true);
    });

    it('should return false for a random string', () => {
      expect(isValidQRTokenFormat('abc123')).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(isValidQRTokenFormat('')).toBe(false);
    });
  });
});
