import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import path from 'node:path';

// The constellation perf harness — a tiny Vite app that mounts
// `<Constellation />` in isolation, with a perf overlay reading
// long tasks and frame intervals from the running surface. The
// harness exists so a contributor can probe perf without running
// the full TanStack Start build, and so the perf:probe script can
// drive a known surface deterministically.
//
// What this config DOESN'T pull in: tanstackStart, tailwindcss,
// the rollup-plugin-visualizer, the prerender configuration. The
// harness mounts React + the constellation alone — the smallest
// dependency closure that still exercises the surface.

const monorepoRoot = path.resolve(import.meta.dirname, '../../..');

export default defineConfig({
  root: import.meta.dirname,
  plugins: [
    viteReact({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
  ],
  resolve: {
    alias: {
      // The package surface — the harness consumes Constellation
      // through `@dby/sky` so it goes through the same boundary
      // the host application uses.
      '@dby/sky': path.resolve(monorepoRoot, 'packages/sky/src/index.ts'),
      // Internal alias the shim's transitive imports still rely on
      // until Phase 2 physically relocates the modules into the
      // package. Once those moves land, this alias retires.
      '@': path.resolve(monorepoRoot, 'src'),
    },
  },
  // The host's `__CFWA_TOKEN__` constant is a Cloudflare beacon
  // token, irrelevant to the harness — stub it as the empty string
  // so the analytics atom no-ops cleanly.
  define: {
    __CFWA_TOKEN__: JSON.stringify(''),
  },
  // The harness's stylesheet imports tokens.css from the host so
  // the constellation reads the same custom properties it would
  // in production. No additional CSS pipeline beyond Vite's
  // built-in handling is needed (we don't need Tailwind here —
  // tokens.css carries the custom properties the surface reads).
  server: {
    // strictPort fails fast if 5180 is already taken — better than
    // silently rolling forward to 5181 and leaving the perf probe
    // pointing at whichever vite happened to be on the original
    // port. The probe spawns the harness fresh; if a stale one is
    // around, we want the visible failure.
    port: 5180,
    strictPort: true,
  },
});
