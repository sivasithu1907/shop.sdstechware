import { defineConfig } from 'vitest/config';

// Unit tests cover pure business logic only (no DOM needed).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
