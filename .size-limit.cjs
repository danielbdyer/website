// Bundle size budget. Blocks PR merges if the gzipped size of the
// initial JS payload regresses past the floor below. Floors are
// high-water-mark: when the actual size drops, lower the floor in the
// same PR that explains why; don't auto-bump on improvements.
//
// Run locally: pnpm size
// Runs in CI via .github/workflows/ci.yml.
//
// PERFORMANCE_BUDGET.md is the spec; this file enforces it.
//
// The "main" entry is the chunk every page loads (the React runtime,
// router, theme store, content loader, and parsers). "Eager client JS"
// is everything a navigation can request before the page is idle —
// main, every route chunk, the sky's structural chunk. The sky's lazy
// layers are budgeted apart: the WebGL atmosphere and the daystar's
// magic (its scarf and GSAP) are fetched only after load and idle,
// gated by the visitor's preferences, and never block a paint; they
// are weight the visitor chooses by lingering, not weight the page
// costs on arrival (PERFORMANCE_BUDGET.md §"The sky's lazy layers").

const LAZY_LAYERS = [
  'dist/client/assets/atmosphereRenderer-*.js',
  'dist/client/assets/daystarMagic-*.js',
];

module.exports = [
  {
    name: 'main entry (every page)',
    path: 'dist/client/assets/index-*.js',
    limit: '175 KB',
    gzip: true,
  },
  {
    // Pass 2 (the latent-sphere navigation) added ~3KB gzipped of
    // pure geometry / camera math. The walk's seams and the hour's
    // face (2026-09-05) grew the sky's structural chunk by ~8KB: the
    // reducer's attention, the traced threads' names, the drawn faces.
    // The floor moved from 215 to 225 with them, named here; most
    // pages never load the sky chunk at all. The look-up as a space
    // and the daystar's seat (the eighth to eleventh passes, the same
    // week) added ~1KB to the main entry — the lift carried frame by
    // frame, the heavens' pitch bridge, the glyph's stand-in with its
    // store and its lazily fetched character — and the floor moved
    // from 225 to 227.
    name: 'eager client JS (every chunk a navigation can request)',
    path: ['dist/client/assets/*.js', ...LAZY_LAYERS.map((glob) => `!${glob}`)],
    limit: '227 KB',
    gzip: true,
  },
  {
    name: "the sky's lazy layers (after load and idle; never blocking)",
    path: LAZY_LAYERS,
    limit: '64 KB',
    gzip: true,
  },
];
