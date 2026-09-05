// Prose (`.md`) is deliberately not *formatted*. Markdown here is voice —
// Danny's italics and paragraph rhythm live in BACKLOG, spec files, and
// works. Prettier's markdown opinions (emphasis style, blank-line
// insertion) would silently rewrite that voice. Format code; leave
// prose. Prose is still *linted* (markdownlint, cspell) — lint reads,
// it doesn't rewrite.
//
// Every checker that can take file paths runs here, on the staged files
// only. The pre-commit hook used to follow this with the whole
// repo-wide `pnpm lint` chain, which re-read every file on every
// commit (~60s for a one-line change); that sweep now belongs to the
// pre-push gate and CI, where it runs once per push rather than once
// per commit. The three repo-scoped scripts whose findings aren't
// per-file (component shapes, spec wikilinks, the voice guard) still
// run in the hook — they finish in well under a second.
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,cjs,mjs,json}': ['prettier --write'],
  '*.css': ['prettier --write', 'stylelint --fix'],
  '*.md': ['markdownlint-cli2'],
  '*.{ts,tsx,md,mdx,css,yaml,json}': ['cspell --no-progress'],
  '*': ['secretlint'],
  // Any change to the design tokens triggers the contrast linter so a
  // token edit can't be committed under-contrast. The script reads the
  // file from disk (not from the staged version), so it runs after
  // prettier rewrites and sees the final committed bytes.
  'src/styles/tokens.css': () => 'pnpm exec node ./scripts/check-color-contrast.mjs',
  // Any change to a work triggers the corpus guard: every file under
  // src/content/ is re-parsed under production strictness, so bad
  // frontmatter, a non-kebab filename, or a wikilink to a work that
  // does not exist fails the commit rather than the next build. The
  // whole corpus is read (not just the staged file) because a wikilink
  // resolves against its neighbors.
  'src/content/**/*.md': () => 'pnpm exec vitest run src/shared/content/corpus.test.ts',
};
