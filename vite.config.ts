import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    TanStackRouterVite({
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    // Bundle visualizer — writes .stats/bundle.html on every build.
    // Kept outside dist/ so it never deploys as a public file. Useful
    // while the SSG pivot is pending for understanding what
    // gray-matter + marked + React actually cost.
    visualizer({
      filename: '.stats/bundle.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
