/**
 * Test Setup
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '3002';
process.env.STORAGE_BACKEND = 'filecoin-ipfs';
process.env.PINATA_API_KEY = 'test-api-key';
process.env.PINATA_SECRET_KEY = 'test-secret-key';

// Mock console methods to reduce noise in tests
const noop = () => {};

(global as any).console = {
  ...console,
  log: noop as any,
  debug: noop as any,
  info: noop as any,
  warn: noop as any,
  // Keep error for debugging
  error: console.error,
};

export {};
