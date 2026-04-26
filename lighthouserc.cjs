// Lighthouse CI configuration — performance, accessibility, SEO, and
// best-practices canary. Runs against the prerendered SSG output.
// Budgets are defined in PERFORMANCE_BUDGET.md and ACCESSIBILITY.md;
// the numbers here should stay in sync with those specs.
//
// Run locally: pnpm lighthouse
// Runs in CI via .github/workflows/ci.yml (the `lighthouse` job).
//
// High-water-mark policy: every assertion is `error` (blocking). Floors
// are calibrated to the current measured baseline — when CI consistently
// scores above a floor, raise the floor in the same PR that explains
// why. Raises are intentional, not automatic. Drops below a floor block
// the merge and the regression is investigated.
//
// Why two assertion sets:
//
// The foyer (/) is the canonical SEO + a11y surface — no preview content,
// indexable, the page that meets visitors first. It hits 1.0 across the
// board today and the spec commits to keeping it there.
//
// Room landings (/studio, /garden, /study, /salon) are preview-content
// pages that emit `noindex, nofollow` to keep sample text out of search
// indexes. Lighthouse penalises that meta heavily (SEO ~0.63). It also
// shows a single accessibility violation (a11y ~0.95) — held in BACKLOG
// for investigation. As real content lands and `noindex` lifts, both
// floors graduate back to 1.0 in the same PR that publishes the work.

/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist/client',
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
      // Foyer: the high-water mark. Indexable, no preview content, the
      // page the site commits to keeping at 1.0.
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1.0 }],
      },
      // Per-URL overrides for the room landings. The `assertMatrix`
      // overrides the default `assertions` for matching URLs.
      assertMatrix: [
        {
          matchingUrlPattern: '^http://localhost/(studio|garden|study|salon)/?$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.95 }],
            // 0.95 = one violation today; held in BACKLOG. Tighten to 1.0
            // once the violation is resolved.
            'categories:accessibility': ['error', { minScore: 0.95 }],
            'categories:best-practices': ['error', { minScore: 0.95 }],
            // 0.6 = the floor under `noindex, nofollow`. Tighten as
            // preview content graduates to authored content (and the
            // robots meta lifts) — that PR is the right place to raise.
            'categories:seo': ['error', { minScore: 0.6 }],
          },
        },
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
