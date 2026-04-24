// Lighthouse CI configuration — the performance, accessibility, SEO, and
// best-practices canary. Runs against the built site (dist/). Budgets are
// defined in PERFORMANCE_BUDGET.md and ACCESSIBILITY.md; the numbers here
// should stay in sync with those specs.
//
// Run locally: pnpm lighthouse
// Runs in CI via .github/workflows/ci.yml (the `lighthouse` job).
// The command builds the site, serves dist/, runs Lighthouse, and asserts
// the category scores against the thresholds below.

/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost/'],
      numberOfRuns: 1,
      settings: {
        // Use a desktop form factor for the baseline; mobile scores can be
        // added as a second run when the content lives on the site.
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        // These are canaries: if a score drops below the target, the build
        // flags it. The site commits to keeping scores near 100.
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      // Results are kept locally. When CI runs this, a target like
      // 'temporary-public-storage' or a dedicated LHCI server can be used.
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
