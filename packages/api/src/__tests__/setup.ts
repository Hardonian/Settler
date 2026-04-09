/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ENCRYPTION_KEY = "test-encryption-key-32-bytes-long!!";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_NAME = "settler_test";
process.env.DB_USER = "postgres";
process.env.DB_PASSWORD = "postgres";
process.env.REDIS_URL = "redis://localhost:6379";

// Increase timeout for integration tests
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Close any open connections, cleanup, etc.
});
