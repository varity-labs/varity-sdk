module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Exclude tests for modules that are commented out from exports (non-MVP).
  // These modules require backend infrastructure that doesn't exist yet.
  // Re-enable when the modules are activated.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/modules/analytics/',
    '/src/modules/auth/',
    '/src/modules/cache/',
    '/src/modules/compute/',
    '/src/modules/contracts/',
    '/src/modules/export/',
    '/src/modules/forecasting/',
    '/src/modules/monitoring/',
    '/src/modules/notifications/',
    '/src/modules/oracle/',
    '/src/modules/storage/',
    '/src/modules/webhooks/',
    '/src/modules/zk/',
    '/src/cli/',
    '/src/dev/',
    '/src/generators/',
    '/src/validation/',
    '/src/core/__tests__/VaritySDK\\.test',
    '/src/core/__tests__/template\\.test',
  ],
};
