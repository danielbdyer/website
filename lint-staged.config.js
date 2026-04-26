// Prose (`.md`) is deliberately excluded. Markdown here is voice — Danny's
// italics and paragraph rhythm live in BACKLOG, spec files, and works.
// Prettier's markdown opinions (emphasis style, blank-line insertion) would
// silently rewrite that voice. Format code; leave prose.
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,cjs,mjs,json,css}': ['prettier --write'],
  // Any change to the design tokens triggers the contrast linter so a
  // token edit can't be committed under-contrast. The script reads the
  // file from disk (not from the staged version), so it runs after
  // prettier rewrites and sees the final committed bytes.
  'src/styles/tokens.css': () => 'pnpm exec node ./scripts/check-color-contrast.mjs',
};
