import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dby/sky': path.resolve(__dirname, './packages/sky/src/index.ts'),
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
    coverage: {
      // Soft floor — scoped to pure logic (domain + utils + seo
      // builders), where strict coverage matches the cost of writing
      // tests. Components and routes are exercised by integration
      // tests; their branch coverage is intentionally not gated.
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/shared/content/**/*.ts',
        'src/shared/seo/**/*.ts',
        'src/shared/utils/**/*.{ts,tsx}',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/index.ts', 'src/shared/utils/view-transition-names.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
