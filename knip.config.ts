import type { KnipConfig } from 'knip';

// Knip — finds unused dependencies, files, and exports. Configured to
// understand TanStack Router's generated route tree and TanStack Start's
// build pipeline so it doesn't report framework-internal references as
// dead code.
const config: KnipConfig = {
  entry: [
    'src/main.tsx',
    'src/router.tsx',
    'src/app/routes/**/*.tsx',
    'vite.config.ts',
    'lhci.cjs',
    'lhci.config.js',
    'eslint.config.js',
    'commitlint.config.js',
    'lint-staged.config.js',
    'knip.config.ts',
    'scripts/**/*.{js,mjs,cjs,ts}',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignore: ['src/app/routeTree.gen.ts'],
  ignoreDependencies: [
    // Transitive that knip doesn't trace through plugin chains.
    '@types/jest-axe',
    '@types/jsdom',
  ],
  rules: {
    files: 'warn',
    dependencies: 'warn',
    exports: 'warn',
    types: 'warn',
    duplicates: 'warn',
  },
};

export default config;
