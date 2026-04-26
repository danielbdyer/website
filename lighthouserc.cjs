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
// Why per-URL assertions:
//
// The foyer (/) is the canonical SEO + a11y surface — no preview content,
// indexable, the page that meets visitors first. It hits 1.0 across the
// board today and the spec commits to keeping it there.
//
// Room landings (/studio, /garden, /study, /salon) are preview-content
// pages that emit `noindex, nofollow` to keep sample text out of search
// indexes. Lighthouse penalises that meta heavily (SEO ~0.63). They also
// scored a single accessibility violation (a11y ~0.95) — the contrast
// fix in the previous commit should graduate them back to 1.0; the
// 0.95 floor here gives a one-PR transition window before tightening.
// As real content lands and `noindex` lifts, both floors graduate back
// to 1.0 in the same PR that publishes the work.
//
// The lhci CLI rejects mixing top-level `assertions` with `assertMatrix`,
// so the foyer ruleset is expressed as its own matchingUrlPattern entry
// rather than a default + override.

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
      assertMatrix: [
        // Foyer — the high-water mark. Indexable, no preview content,
        // the page the site commits to keeping at 1.0 a11y/SEO.
        {
          matchingUrlPattern: '^http://localhost/$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.95 }],
            'categories:accessibility': ['error', { minScore: 1.0 }],
            'categories:best-practices': ['error', { minScore: 0.95 }],
            'categories:seo': ['error', { minScore: 1.0 }],
          },
        },
        // Room landings — preview-content pages with `noindex, nofollow`.
        // SEO floor of 0.6 reflects the noindex penalty; a11y floor of
        // 0.95 was the pre-contrast-fix baseline and can tighten to 1.0
        // after the next CI run confirms the violation is resolved.
        {
          matchingUrlPattern: '^http://localhost/(studio|garden|study|salon)/?$',
          assertions: {
            'categories:performance': ['error', { minScore: 0.95 }],
            'categories:accessibility': ['error', { minScore: 0.95 }],
            'categories:best-practices': ['error', { minScore: 0.95 }],
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
