import { generateSecureId } from "../src/utils";

describe("generateSecureId", () => {
  it("should generate a secure ID with the default prefix", () => {
    const id = generateSecureId();
    expect(id).toMatch(/^id_[a-f0-9]{32}$/);
  });

  it("should generate a secure ID with a custom prefix", () => {
    const id = generateSecureId("custom");
    expect(id).toMatch(/^custom_[a-f0-9]{32}$/);
  });

  it("should use fallback when crypto is not available", () => {
    // Mock the global crypto object to simulate an environment without crypto
    const originalCrypto = global.crypto;

    try {
      // Temporarily remove crypto from the global object
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const id = generateSecureId("fallback");
      expect(id).toMatch(/^fallback_[a-f0-9]{32}$/);

    } finally {
      // Restore the original crypto object
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    }
  });

  it("should use fallback when crypto.getRandomValues is not available", () => {
    // Mock the global crypto object to simulate an environment without getRandomValues
    const originalCrypto = global.crypto;

    try {
      // Temporarily mock crypto without getRandomValues
      Object.defineProperty(global, 'crypto', {
        value: {}, // Empty object, no getRandomValues
        writable: true,
        configurable: true
      });

      const id = generateSecureId("fallback_no_get_random");
      expect(id).toMatch(/^fallback_no_get_random_[a-f0-9]{32}$/);

    } finally {
      // Restore the original crypto object
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    }
  });
});
