import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['shared/src/**/*.ts', 'backend/src/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@nusaf/shared': './shared/src',
    },
  },
});
