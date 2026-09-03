import { expect, test } from '@playwright/test';

// Real-browser performance guards for the constellation's travel.
// The vitest perf tests cover the JS hot path (projection, the
// atmosphere frame); these cover what a real browser does — paint,
// composite, the WebGL firmament's draws, the camera transform's
// rasterizer cost — while the camera travels between stars.
//
// The metric: **long-task delta**, not absolute count or FPS. We
// measure the page's idle long-task count first (that captures the
// WebGL firmament's cost, the heavens' idle cadence, etc.), then again
// during travel. The delta is what travel contributes. A clean
// implementation should add few or no long tasks beyond the page's
// resting cost; a regression that blocks the main thread on every
// frame would push the delta way above baseline.
//
// FPS is the metric people reach for first but it's unreliable in
// headless and depends on GPU/display. Long-task delta is honest in
// any environment because it measures *blocking work added*, not
// frame production.
//
// Tagged @perf so they run on demand:
//   pnpm test:e2e --grep @perf
// (Run under `xvfb-run` on a CI machine without a display.)

test.use({
  launchOptions: {
    args: [
      '--disable-frame-rate-limit',
      '--disable-gpu-vsync',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  },
});

const PERF_TAG = { tag: '@perf' as const };

interface LongTaskReport {
  count: number;
  longest: number;
  total: number;
}

async function observeLongTasks(
  page: import('@playwright/test').Page,
  durationMs: number,
): Promise<LongTaskReport> {
  await page.evaluate(() => {
    interface PerfWindow extends Window {
      __longTasks?: PerformanceEntry[];
      __longTaskObserver?: PerformanceObserver;
    }
    const w = window as PerfWindow;
    w.__longTasks = [];
    w.__longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) w.__longTasks!.push(entry);
    });
    w.__longTaskObserver.observe({ entryTypes: ['longtask'] });
  });
  await page.waitForTimeout(durationMs);
  return await page.evaluate(() => {
    interface PerfWindow extends Window {
      __longTasks?: PerformanceEntry[];
      __longTaskObserver?: PerformanceObserver;
    }
    const w = window as PerfWindow;
    w.__longTaskObserver?.disconnect();
    const tasks = w.__longTasks ?? [];
    let longest = 0;
    let total = 0;
    for (const t of tasks) {
      if (t.duration > longest) longest = t.duration;
      total += t.duration;
    }
    return { count: tasks.length, longest, total };
  });
}

function annotate(t: import('@playwright/test').TestInfo, label: string, r: LongTaskReport): void {
  t.annotations.push({
    type: label,
    description: `count=${r.count} longest=${r.longest.toFixed(1)}ms total=${r.total.toFixed(1)}ms`,
  });
}

async function openSkyAtRest(page: import('@playwright/test').Page) {
  await page.goto('/sky');
  await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
  // Let the sky-arrival animation finish.
  await page.waitForTimeout(1800);
}

test.describe('constellation main-thread health', () => {
  test(
    'traveling to a star does not add long tasks beyond the baseline',
    PERF_TAG,
    async ({ page }, info) => {
      await openSkyAtRest(page);

      // Baseline: page at rest — the WebGL firmament plus the travel
      // loop's idle cadence carrying the heavens' turn.
      const baseline = await observeLongTasks(page, 2000);
      annotate(info, 'baseline', baseline);

      // Travel: the sky opens at the pole, so clicking any star starts a
      // held-second crossing rather than opening it. Measure the whole
      // travel window.
      const stars = page.locator('svg.constellation a.constellation-star');
      await stars.nth(2).click({ force: true });
      const travel = await observeLongTasks(page, 2200);
      annotate(info, 'travel', travel);

      // Travel must not *add* long tasks beyond the page's resting
      // cost: total may grow by 50% of baseline plus 100ms headroom
      // for browser variance; the longest task may exceed baseline's
      // by at most 100ms — one incidental frame, not a systemic one.
      expect(travel.total).toBeLessThan(baseline.total * 1.5 + 100);
      expect(travel.longest).toBeLessThan(baseline.longest + 100);
    },
  );

  test(
    'taking a bearing from the whisper travels without piling up long tasks',
    PERF_TAG,
    async ({ page }, info) => {
      await openSkyAtRest(page);

      const baseline = await observeLongTasks(page, 1500);
      annotate(info, 'baseline', baseline);

      await page.locator('.sky-whisper__bearing:enabled').first().click();
      const travel = await observeLongTasks(page, 2200);
      annotate(info, 'travel', travel);

      expect(travel.total).toBeLessThan(baseline.total * 1.5 + 100);
      expect(travel.longest).toBeLessThan(baseline.longest + 100);
    },
  );
});
