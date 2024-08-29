import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: true,
  },
  test: {
    include: ['src/**/__tests__/**/*.spec.ts'],
    sequence: {
      hooks: 'list',
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.ts', '!src/index.ts'],
    },
  },
});
