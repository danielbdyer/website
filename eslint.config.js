import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactCompiler from 'eslint-plugin-react-compiler';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unicorn from 'eslint-plugin-unicorn';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  { ignores: ['dist', 'src/app/routeTree.gen.ts', 'e2e/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.ts', '*.cjs', '*.mjs', '*.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── React ────────────────────────────────────────────────────
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react-compiler': reactCompiler,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // React Compiler surface — flags components/hooks the compiler
      // can't safely auto-memoize (mutations, conditionally-called
      // hooks, side effects in render). The babel plugin in
      // vite.config.ts does the actual memoization at build time;
      // this rule names violations at lint time so they're caught
      // before the compiler bails silently. See REACT_NORTH_STAR.md
      // §"React Compiler" for the adoption note.
      'react-compiler/react-compiler': 'error',
      // JSX nesting depth — North Star §"Structural Thresholds"
      // commits to 2–3 target, 4 hard limit. Matches working memory
      // stack depth; deeper trees are a refactor signal, not a style
      // choice. Test files pass through unchanged because they are
      // already exempt from `max-lines-per-function`.
      'react/jsx-max-depth': ['error', { max: 4 }],
      // Manual memoization is unnecessary since React Compiler is
      // configured (vite.config.ts). The compiler auto-memoizes at
      // build time; manual `useMemo`/`useCallback`/`memo`/`forwardRef`
      // calls are warned, not errored, so a future agent who genuinely
      // needs to escape the compiler can disable per line with a
      // comment naming the reason. See REACT_NORTH_STAR.md
      // §"React Compiler" for the rule of thumb.
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.name='useMemo']",
          message:
            'React Compiler auto-memoizes — manual `useMemo` is rarely needed. If the compiler bails on this case, suppress with `// eslint-disable-next-line` and a one-line reason.',
        },
        {
          selector: "CallExpression[callee.name='useCallback']",
          message:
            'React Compiler auto-memoizes — manual `useCallback` is rarely needed. If the compiler bails on this case, suppress with `// eslint-disable-next-line` and a one-line reason.',
        },
      ],
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'react',
              importNames: ['memo', 'forwardRef'],
              message:
                "React 19: `forwardRef` is unnecessary (`ref` is a regular prop) and `memo` is unnecessary (React Compiler auto-memoizes). See REACT_NORTH_STAR.md §'React Compiler'.",
            },
          ],
        },
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

  // ── Unicorn — modern JS antipattern catcher ─────────────────
  // Recommended config minus a few rules that fight our voice or our
  // file-naming convention (PascalCase atoms vs unicorn's kebab-case
  // preference, abbreviation rules vs `props`/`ref`).
  {
    plugins: { unicorn },
    rules: {
      ...unicorn.configs.recommended.rules,
      // Filenames: we use PascalCase for atom/molecule/organism files
      // per REACT_NORTH_STAR.md — `Diamond.tsx`, `WorkRow.tsx`, etc.
      'unicorn/filename-case': 'off',
      // Abbreviations: `props`, `ref`, `prev`, `i` are React idioms;
      // forcing `properties`/`reference`/`previous` is over-pedantic.
      'unicorn/prevent-abbreviations': 'off',
      // null vs undefined: TanStack Router and many DOM APIs return
      // null; the convention isn't worth fighting.
      'unicorn/no-null': 'off',
      // Reduce: legitimately the right tool for some site flows.
      'unicorn/no-array-reduce': 'off',
      // ForEach: same — readable in many cases.
      'unicorn/no-array-for-each': 'off',
      // Negation: false positives on `if (!x)` patterns.
      'unicorn/no-negated-condition': 'off',
      // Top-level await: not relevant to our SSG runtime.
      'unicorn/prefer-top-level-await': 'off',
      // Module export naming: we co-locate components and types,
      // which trips this rule.
      'unicorn/no-anonymous-default-export': 'off',
      // Callback-reference: `.some(isPreviewWork)` is idiomatic; the
      // wrapper-arrow rewrite reads as ceremony, not safety.
      'unicorn/no-array-callback-reference': 'off',
      // Function-scoping: surfaces inside-fixture arrows that read
      // perfectly clearly inline; declined to keep tests cohesive.
      'unicorn/consistent-function-scoping': 'off',
    },
  },

  // The root layout file is a structural exception to jsx-max-depth.
  // RootDocument > ThemeProvider > html/body/main wrapping is inherent
  // to root layouts; the depth rule is meant to flag over-nested
  // feature components, not the framework's own scaffolding.
  {
    files: ['**/src/app/routes/__root.tsx'],
    rules: {
      'react/jsx-max-depth': 'off',
    },
  },

  // Test files are exempt from import restrictions — they may need
  // wildcard React imports for stateful test fixtures, and the
  // no-manual-memoization warning doesn't apply to test code.
  // Type-checked rules also relax for tests where mocks intentionally
  // shape `any`-typed surfaces and empty methods are placeholders.
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/only-throw-error': 'off',
    },
  },

  // The async barrel in `src/shared/content/index.ts` and the display
  // wrappers are intentionally async-without-await per
  // RENDERING_STRATEGY.md §"The async barrel" — the signature is the
  // architectural seam for a future hybrid render path. Disable
  // require-await for those files.
  {
    files: ['src/shared/content/index.ts', 'src/shared/content/display.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },

  // ThemeProvider's default context value is an empty `toggle` —
  // allowed because a Provider always overrides it. Empty-function
  // warnings here would force ceremonial busywork. The unbound-method
  // rule fights `useSyncExternalStore`'s canonical method-as-callback
  // pattern (subscribe/getSnapshot/getServerSnapshot) — declined here
  // for the same reason; the React 19 hook is the source of truth.
  {
    files: ['src/app/providers/**'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Atom tier — REACT_NORTH_STAR.md commits atoms to "zero internal
  // state, zero side effects, zero domain knowledge." The rules below
  // enforce that contract at lint time. New atoms inheriting these
  // rules can't accidentally absorb the responsibilities of a
  // molecule/organism without the lint catching it.
  {
    files: ['src/shared/atoms/**/*.{ts,tsx}'],
    ignores: ['src/shared/atoms/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useState', 'useEffect', 'useReducer', 'useContext', 'useRef'],
              message:
                "Atoms are stateless and side-effect-free per REACT_NORTH_STAR.md §'Atoms'. If state or effects are needed, the component is a molecule (or higher) and lives one tier up. Exceptions: `useId` and refs forwarded for accessibility — request a per-line disable with a one-line reason.",
            },
            {
              name: 'react',
              importNames: ['memo', 'forwardRef'],
              message:
                "React 19: `forwardRef` is unnecessary (`ref` is a regular prop) and `memo` is unnecessary (React Compiler auto-memoizes). See REACT_NORTH_STAR.md §'React Compiler'.",
            },
          ],
          patterns: [
            {
              // Atoms may consume *types* from the domain (their props
              // can be domain-shaped) but must not import runtime
              // domain logic (loader, preview-data, display).
              group: [
                '@/shared/content/loader',
                '@/shared/content/display',
                '@/shared/content/preview-data',
                '@/shared/content/wikilinks',
                '@/shared/content/wikilink-marked',
              ],
              message:
                "Atoms have zero domain knowledge per REACT_NORTH_STAR.md §'Atoms'. Type imports from `@/shared/content/schema` are allowed (types are the architectural seam); runtime logic belongs to a higher tier.",
            },
          ],
        },
      ],
    },
  },

  // Route files use TanStack Router's `throw notFound()` and
  // `throw redirect()` idioms; these throw control-flow tokens that
  // aren't `Error` subclasses, which the `only-throw-error` rule
  // flags. The framework owns the convention.
  {
    files: ['src/app/routes/**'],
    rules: {
      '@typescript-eslint/only-throw-error': 'off',
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
