import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  { ignores: ['dist', 'src/app/routeTree.gen.ts'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── React ────────────────────────────────────────────────────
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // TanStack Router route files export Route + component — expected pattern
  {
    files: ['**/src/app/routes/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Providers export both hook and component — expected pattern
  {
    files: ['**/src/app/providers/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // ── Accessibility ────────────────────────────────────────────
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: jsxA11y.flatConfigs.recommended.rules,
  },

  // ── Boundary enforcement ─────────────────────────────────────
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: ['src/app/**'], mode: 'full' },
        { type: 'feature-containers', pattern: ['src/features/*/containers/**'], mode: 'full' },
        { type: 'feature-hooks', pattern: ['src/features/*/hooks/**'], mode: 'full' },
        { type: 'feature-components', pattern: ['src/features/*/components/**'], mode: 'full' },
        { type: 'feature-domain', pattern: ['src/features/*/domain/**'], mode: 'full' },
        { type: 'feature-types', pattern: ['src/features/*/types*'], mode: 'full' },
        { type: 'shared', pattern: ['src/shared/**'], mode: 'full' },
        { type: 'infrastructure', pattern: ['src/infrastructure/**'], mode: 'full' },
        { type: 'styles', pattern: ['src/styles/**'], mode: 'full' },
      ],
      'boundaries/ignore': ['src/main.tsx', 'src/vite-env.d.ts'],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            // App can import anything
            { from: [['app']], allow: [['*']] },

            // Containers → hooks, components, shared
            {
              from: [['feature-containers']],
              allow: [['feature-hooks'], ['feature-components'], ['shared'], ['feature-types']],
            },

            // Hooks → domain, types, shared, infrastructure
            {
              from: [['feature-hooks']],
              allow: [['feature-domain'], ['feature-types'], ['shared'], ['infrastructure']],
            },

            // Components → shared only (no hooks, no infra, no domain)
            {
              from: [['feature-components']],
              allow: [['shared'], ['feature-types']],
            },

            // Domain → types, shared only (NO React)
            {
              from: [['feature-domain']],
              allow: [['feature-types'], ['shared']],
            },

            // Feature types → shared types only
            {
              from: [['feature-types']],
              allow: [['shared']],
            },

            // Shared → shared (internal refs ok)
            {
              from: [['shared']],
              allow: [['shared']],
            },

            // Infrastructure → shared
            {
              from: [['infrastructure']],
              allow: [['shared']],
            },
          ],
        },
      ],
    },
  },

  // ── General rules ────────────────────────────────────────────
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // North star: target 60 lines, hard limit 80. ESLint's max-lines-per-function
      // only supports a single severity, so we enforce the hard limit here. The 60-line
      // target is held culturally and in REACT_NORTH_STAR.md's threshold tables.
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
    },
  },

  // Test files use describe() to containerize related assertions; the 80-line
  // limit fights that legitimate pattern. Disable the function-size rule for
  // test files — the per-test cognitive load is what matters, not the per-
  // describe total.
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
);
