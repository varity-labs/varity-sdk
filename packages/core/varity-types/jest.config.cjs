module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Exclude non-MVP module-specific test suites.
  // The index.test.ts is rewritten to test actual MVP exports.
  // Re-enable individual module tests when those modules are activated.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/thirdweb\\.types\\.test',
    '/src/__tests__/s3-compatible\\.types\\.test',
    '/src/__tests__/gcs-compatible\\.types\\.test',
    '/src/__tests__/storage\\.types\\.test',
    '/src/__tests__/migration\\.types\\.test',
    '/src/__tests__/auth\\.types\\.test',
  ],
};
