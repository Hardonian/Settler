/**
 * Encryption Tests
 * Tests for encryption/decryption edge cases and backward compatibility
 */

import { encrypt, decrypt } from '../../infrastructure/security/encryption';
import { SecretsManager } from '../../infrastructure/security/SecretsManager';
import { config } from '../../config';

// Mock SecretsManager
jest.mock('../../infrastructure/security/SecretsManager');
jest.mock('../../config', () => ({
  config: {
    encryption: {
      key: 'test-encryption-key-32-bytes-long!!',
    },
  },
}));

const mockSecretsManager = SecretsManager as jest.Mocked<typeof SecretsManager>;

describe('Encryption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecretsManager.getSecret.mockReturnValue(undefined);
  });

  describe('encrypt', () => {
    it('should encrypt data successfully', () => {
      const plaintext = 'sensitive-data-123';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
      expect(() => JSON.parse(encrypted)).not.toThrow();
    });

    it('should use SecretsManager when available', () => {
      mockSecretsManager.getSecret.mockReturnValue('hex-encoded-key-64-chars-long-for-testing-purposes-12345678901234567890');

      const plaintext = 'test-data';
      encrypt(plaintext);

      expect(mockSecretsManager.getSecret).toHaveBeenCalledWith('ENCRYPTION_KEY');
    });

    it('should fallback to config when SecretsManager unavailable', () => {
      mockSecretsManager.getSecret.mockReturnValue(undefined);

      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      // Should still work with config fallback
    });

    it('should handle hex-encoded keys', () => {
      const hexKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      mockSecretsManager.getSecret.mockReturnValue(hexKey);

      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
    });

    it('should handle raw string keys', () => {
      const rawKey = 'my-secret-key-that-is-exactly-32-bytes!!';
      mockSecretsManager.getSecret.mockReturnValue(rawKey);

      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
    });

    it('should handle short keys by deriving', () => {
      const shortKey = 'short';
      mockSecretsManager.getSecret.mockReturnValue(shortKey);

      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
    });
  });

  describe('decrypt', () => {
    it('should decrypt data successfully', () => {
      const plaintext = 'sensitive-data-123';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle new JSON format', () => {
      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);
      const parsed = JSON.parse(encrypted);

      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('encrypted');
      expect(parsed).toHaveProperty('authTag');

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle legacy base64 format', () => {
      // Create legacy format encrypted data
      const crypto = require('crypto');
      const key = crypto.scryptSync('test-key', 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const salt = crypto.randomBytes(64);

      cipher.setAAD(salt);
      let encrypted = cipher.update('legacy-data', 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();

      const legacyFormat = Buffer.concat([
        salt,
        iv,
        authTag,
        encrypted,
      ]).toString('base64');

      // Mock the key retrieval
      mockSecretsManager.getSecret.mockReturnValue('test-key');

      const decrypted = decrypt(legacyFormat);
      expect(decrypted).toBe('legacy-data');
    });

    it('should throw error on invalid encrypted data', () => {
      expect(() => decrypt('invalid-data')).toThrow();
    });

    it('should throw error on tampered data', () => {
      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);
      const tampered = encrypted.replace('a', 'b');

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw error when key is missing', () => {
      mockSecretsManager.getSecret.mockReturnValue(undefined);
      // Also need to mock config to return undefined
      jest.spyOn(require('../../config'), 'config', 'get').mockReturnValue({
        encryption: { key: undefined },
      });

      expect(() => encrypt('test-data')).toThrow('Encryption key');
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '测试数据 🚀 émojis';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle large data', () => {
      const plaintext = 'x'.repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('round-trip compatibility', () => {
    it('should maintain compatibility across different key formats', () => {
      const testCases = [
        { key: 'hex-encoded-key-64-chars-long-for-testing-purposes-12345678901234567890', format: 'hex' },
        { key: 'raw-string-key-exactly-32-bytes-long!!', format: 'raw' },
        { key: 'short', format: 'derived' },
      ];

      testCases.forEach(({ key, format }) => {
        mockSecretsManager.getSecret.mockReturnValue(key);
        const plaintext = `test-data-${format}`;
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(plaintext);
      });
    });
  });
});
