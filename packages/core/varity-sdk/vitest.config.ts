import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: resolve(__dirname),
    include: ['src/orchestration/__tests__/**/*.test.ts'],
    testTimeout: 10000,
  },
});
