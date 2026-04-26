import { expect, test } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Phrases the ErrorBoundary and NotFound surfaces render. Either of
// them appearing on a page means hydration failed (ErrorBoundary) or
// the route fell through to NotFound when it shouldn't have. Both are
// failure modes; assert against both to cover the full negative case.
const FAILURE_PHRASES = ['[Something here caught and fell.]', "[This door doesn't open.]"] as const;

// Walk dist/client/ for every prerendered route. Reading pages.json
// would miss preview-content routes (the build's filter step strips
// them so they don't pollute the sitemap), and a hand-curated list
// silently rots whenever a new room or work appears. The filesystem
// is the truth.
function loadPrerenderedPaths(): string[] {
  const root = 'dist/client';
  const out: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry === 'index.html') {
        const rel = relative(root, dir).split(sep).join('/');
        out.push(rel === '' ? '/' : `/${rel}`);
      }
    }
  }
  walk(root);
  return out.sort();
}

const PRERENDERED_PATHS = loadPrerenderedPaths();

function expectNoFailureSurface(content: string, where: string) {
  for (const phrase of FAILURE_PHRASES) {
    expect.soft(content, `Failure surface visible at ${where}: "${phrase}"`).not.toContain(phrase);
  }
}

// Smoke tag: every direct-load case is part of the core smoke tier that
// runs on every `pnpm test`. The class of bug these guard against
// (loader failures during hydration, like the createServerFn break
// that broke client-side nav) only reproduces in a real browser.
test.describe('Error boundary fallback never renders', () => {
  for (const path of PRERENDERED_PATHS) {
    test(`direct load: ${path}`, { tag: '@smoke' }, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
      });

      await page.goto(path, { waitUntil: 'networkidle' });
      expectNoFailureSurface(await page.content(), `direct load ${path}`);
      expect.soft(consoleErrors, `console errors at ${path}`).toEqual([]);
    });
  }

  test(
    'walking the nav between every room never lands on the failure surface',
    {
      tag: '@smoke',
    },
    async ({ page }) => {
      // The original bug: every client-side navigation between rooms hit
      // the failure surface because the route loader called a server fn
      // that 404'd in the SSG-only deploy. That bug was masked by
      // `reloadDocument` everywhere, then re-exposed when client-side nav
      // was re-enabled. This walk is the exact scenario that reproduced
      // it; if any surface here regresses, that whole class of bug is
      // back.
      const consoleErrors: string[] = [];
      page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
      });

      await page.goto('/');
      expectNoFailureSurface(await page.content(), 'foyer (initial)');

      // Walk every room twice in a different order to catch any "first
      // navigation works, second one breaks" or "boundary stays poisoned"
      // regressions.
      const sequence = [
        'Studio',
        'Garden',
        'Study',
        'Salon',
        'Studio',
        'Salon',
        'Garden',
        'Study',
      ] as const;
      for (const room of sequence) {
        await page.getByRole('link', { name: room, exact: true }).click();
        await page.waitForLoadState('networkidle');
        expectNoFailureSurface(await page.content(), `room ${room} via nav`);
      }

      expect.soft(consoleErrors, 'console errors during nav').toEqual([]);
    },
  );

  test('opening a work and returning to its room never lands on the failure surface', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
    });

    // Pick a work in each room (where one exists) and walk in → out → next
    // room. If a work-page loader regresses, this test catches it.
    const workPaths = PRERENDERED_PATHS.filter((p) => /^\/[^/]+\/[^/]+$/.test(p));
    for (const workPath of workPaths) {
      const [, room] = workPath.split('/');
      await page.goto(workPath);
      await page.waitForLoadState('networkidle');
      expectNoFailureSurface(await page.content(), `direct load ${workPath}`);

      // Click the back-to-room link.
      const back = page.getByRole('link', { name: new RegExp(`← The ${cap(room)}`) });
      await back.click();
      await page.waitForLoadState('networkidle');
      expectNoFailureSurface(await page.content(), `back to /${room} from ${workPath}`);
    }

    expect.soft(consoleErrors, 'console errors during work walks').toEqual([]);
  });
});

function cap(s: string | undefined): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
