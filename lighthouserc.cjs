// Lighthouse CI configuration — performance, accessibility, SEO, and
// best-practices canary. Runs against the prerendered SSG output.
// Budgets are defined in PERFORMANCE_BUDGET.md and ACCESSIBILITY.md;
// the numbers here should stay in sync with those specs.
//
// Run locally: pnpm lighthouse
// Runs in CI via .github/workflows/ci.yml (the `lighthouse` job).
//
// High-water-mark policy: every assertion is `error` (blocking). Floors
// live in `lighthouserc-floors.json` (separated so the ratchet workflow
// can mutate them programmatically without parsing this CJS file).
// `pnpm lighthouse:report` after every run prints actual scores plus
// headroom over the floor.
//
// Floors only ratchet upward:
//   - Drops below floor block PR merge (this file's `error` assertions).
//   - Sustained improvements raise floors via the scheduled workflow at
//     `.github/workflows/ratchet-lighthouse.yml`, which opens a PR with
//     the proposed raises after multi-run sampling.
// Manual edits to lighthouserc-floors.json are also welcome — the
// ratchet is for automation, not exclusivity.

const floors = require('./lighthouserc-floors.json');

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
      assertMatrix: floors.map(({ matchingUrlPattern, scores }) => ({
        matchingUrlPattern,
        assertions: Object.fromEntries(
          Object.entries(scores).map(([category, minScore]) => [
            `categories:${category}`,
            ['error', { minScore }],
          ]),
        ),
      })),
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
