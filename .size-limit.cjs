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
// router, theme store, content loader, and parsers). "Total initial
// JS" is the union of everything served on a cold visit to the foyer:
// main + the foyer route chunk + any preloaded chunks.

module.exports = [
  {
    name: 'main entry (every page)',
    path: 'dist/client/assets/index-*.js',
    limit: '175 KB',
    gzip: true,
  },
  {
    // Pass 2 (the latent-sphere navigation) adds ~3KB gzipped of
    // pure geometry / camera math: sphere conversions, Cartesian
    // basis, ray-sphere intersect, geodesic basin physics. The
    // growth is content; the main entry stays well under its
    // limit and most pages don't load the sky chunk.
    name: 'all client JS (every chunk shipped)',
    path: 'dist/client/assets/*.js',
    limit: '215 KB',
    gzip: true,
  },
];
