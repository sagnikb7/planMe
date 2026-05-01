import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.test.ts'],
    pool: 'forks',
    forks: { singleFork: true },
    testTimeout: 15000,
  },
});
