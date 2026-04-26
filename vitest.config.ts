import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    // happy-dom is ~2× faster than jsdom for the DOM surface we exercise
    // (component rendering, event firing, queryByText). Tests that need
    // browser-only behaviors (real layout, real CSS resolution) live in
    // Playwright per the test split in coding/SKILL.md.
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
