// Lighthouse CI configuration — performance, accessibility, SEO, and
// best-practices canary. Runs against the prerendered SSG output.
// Budgets are defined in PERFORMANCE_BUDGET.md and ACCESSIBILITY.md;
// the numbers here should stay in sync with those specs.
//
// Run locally: pnpm lighthouse
// Runs in CI via .github/workflows/ci.yml (the `lighthouse` job).
//
// High-water-mark policy: every assertion is `error` (blocking). The
// floors below are conservative — the site commits to scores near 100.
// When CI consistently scores above a floor, raise the floor in the
// same PR that explains why. Raises are intentional, not automatic.
// When a score drops below a floor, the build fails and the regression
// is investigated before merge.

/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      // Prerendered HTML per route lives under dist/client/.
      staticDistDir: './dist/client',
      // Foyer plus every room landing. Per-work coverage can be added
      // here as content matures and reading patterns shift.
      url: [
        'http://localhost/',
        'http://localhost/studio',
        'http://localhost/garden',
        'http://localhost/study',
        'http://localhost/salon',
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      // All-error: every category is a blocking gate. The PERFORMANCE
      // BUDGET and ACCESSIBILITY commitments are real constraints, not
      // guidelines — a regression here is a regression worth blocking.
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1.0 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
