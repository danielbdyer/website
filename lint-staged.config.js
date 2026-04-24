// Prose (`.md`) is deliberately excluded. Markdown here is voice — Danny's
// italics and paragraph rhythm live in BACKLOG, spec files, and works.
// Prettier's markdown opinions (emphasis style, blank-line insertion) would
// silently rewrite that voice. Format code; leave prose.
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,cjs,mjs,json,css}': ['prettier --write'],
};
