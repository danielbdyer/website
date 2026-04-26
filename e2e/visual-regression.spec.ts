import { expect, test } from '@playwright/test';

// Visual regression: catches CSS/layout breakage that no logical
// assertion would notice. The baseline PNGs live alongside this spec
// (committed to the repo). When a deliberate visual change lands, run
// `pnpm exec playwright test e2e/visual-regression.spec.ts --update-snapshots`
// in the same PR that explains the change.
//
// Coverage: every room landing in light + dark, on every configured
// viewport (desktop and mobile per playwright.config.ts). 5 rooms × 2
// themes × 2 viewports = 20 baselines.
//
// What we deliberately don't snapshot:
//   - Per-work pages (large surface, pages share rendering with the
//     room landings — a breakage there shows up here too).
//   - Animation frames (the Reveal fade-in and the geometric figure
//     would make every screenshot non-deterministic).
//   - Hover/focus states (snapshot on the resting state only).

const ROOMS = ['/', '/studio', '/garden', '/study', '/salon'] as const;
const THEMES = ['light', 'dark'] as const;

async function freezeMotionAndAwaitStillness(page: import('@playwright/test').Page) {
  // Force the prefers-reduced-motion media query to hold so transitions
  // and scroll-reveal collapse to instant. The site's CSS already honors
  // this preference (tokens.css at the bottom).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Also pin the geometric figure: even with reduced-motion, the SVG's
  // animationPlayState may already be 'running' from the IntersectionObserver
  // before the media query takes effect on a re-render. Hold it still.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    `,
  });
}

// Tag: @visual. Excluded from the @smoke tier and from the default
// Playwright run in CI's `playwright` job because it requires committed
// baseline PNGs to compare against. The dedicated `update-snapshots.yml`
// workflow runs `playwright test --grep @visual --update-snapshots` to
// generate baselines in the same Docker image CI uses, and commits them
// back to the branch. Once baselines exist, this tag is folded back
// into the regular @smoke set in a follow-up PR.
test.describe('Visual regression', { tag: '@visual' }, () => {
  for (const theme of THEMES) {
    for (const room of ROOMS) {
      const label = room === '/' ? 'foyer' : room.slice(1);
      test(`${theme} — ${label}`, async ({ page }) => {
        // Set the theme via localStorage before navigating; the inline
        // pre-paint script in __root.tsx reads it and applies the class
        // to <html> before first paint.
        await page.addInitScript((t) => {
          localStorage.setItem('theme', t);
        }, theme);

        await page.goto(room, { waitUntil: 'networkidle' });
        await freezeMotionAndAwaitStillness(page);

        // Wait one frame after style injection so the cancellation lands
        // before the screenshot.
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

        await expect(page).toHaveScreenshot(`${theme}-${label}.png`, {
          fullPage: true,
          // A few pixels of legitimate rendering variance shouldn't fail
          // the test. Real regressions move many more pixels than this.
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  }
});
