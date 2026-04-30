import { expect, test } from '@playwright/test';

// Routable nav coverage moved to vitest (src/app/routes/routes.test.tsx)
// where it runs ~25× faster (1.2s for 7 cases vs ~30s in Playwright).
// What remains here is what genuinely needs a real browser engine:
// viewport-overflow assertions that depend on real CSS layout.

const mobileCriticalPages = [
  '/',
  '/studio',
  '/garden',
  '/study',
  '/salon',
  '/sky',
  '/salon/arvo-part-and-the-room-between-notes',
] as const;

// Smoke tag: viewport overflow is a real-browser-only assertion (happy-dom
// and jsdom have no layout engine). The bug class it guards against —
// content escaping the viewport — is exactly the kind of CSS regression
// that changes shape silently and only shows up to a visitor on a real
// device.
test(
  'critical pages stay within the viewport without horizontal overflow',
  { tag: '@smoke' },
  async ({ page }) => {
    for (const path of mobileCriticalPages) {
      await page.goto(path);

      const metrics = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        const main = document.querySelector('main');
        const navBox = nav?.getBoundingClientRect();
        const mainBox = main?.getBoundingClientRect();

        return {
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          navLeft: navBox?.left ?? 0,
          navRight: navBox?.right ?? 0,
          mainLeft: mainBox?.left ?? 0,
          mainRight: mainBox?.right ?? 0,
        };
      });

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
      expect(metrics.navLeft).toBeGreaterThanOrEqual(-1);
      expect(metrics.mainLeft).toBeGreaterThanOrEqual(-1);
      expect(metrics.navRight).toBeLessThanOrEqual(metrics.innerWidth + 1);
      expect(metrics.mainRight).toBeLessThanOrEqual(metrics.innerWidth + 1);
    }
  },
);
