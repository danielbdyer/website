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
  // Mirror the build-time define from vite.config.ts so the tests see
  // the same `__CFWA_TOKEN__` constant the application sees in dev/prod.
  // Tests get an empty string by default (no beacon); a test that wants
  // to exercise the beacon path can override this via vi.stubGlobal.
  define: {
    __CFWA_TOKEN__: JSON.stringify(''),
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
