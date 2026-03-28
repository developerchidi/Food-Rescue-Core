import { webcrypto } from "crypto";

/**
 * Generates a secure, unique token for QR codes.
 * Format: `FR-{TIMESTAMP}-{RANDOM_HEX}`
 * Example: `FR-1706692345678-a1b2c3d4`
 * 
 * We include a timestamp to ensure better sorting and uniqueness over time,
 * and sufficient random entropy to prevent guessing.
 */
export async function generateSecureQRToken(): Promise<string> {
  // Use current timestamp in base36 to shorten it
  const timestamp = Date.now().toString(36).toUpperCase();

  // Generate 8 bytes of random data for high entropy
  const randomBuffer = new Uint8Array(8);
  crypto.getRandomValues(randomBuffer);
  const randomHex = Array.from(randomBuffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `FR-${timestamp}-${randomHex}`;
}

/**
 * Validates the format of a QR token.
 * Does NOT check database existence, only format.
 */
export function isValidQRTokenFormat(token: string): boolean {
  // Regex: FR-[AlphaNumeric]-[Hex]
  const regex = /^FR-[A-Z0-9]+-[0-9a-f]{16}$/;
  return regex.test(token);
}
