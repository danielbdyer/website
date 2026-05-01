import { expect, test } from '@playwright/test';

// Real-browser performance guards for the constellation's
// navigation surface. The vitest perf tests cover the JS hot path
// in jsdom (basin field, nearest node, flick velocity); these
// cover what a real browser does — paint, composite, the WebGL
// firmament's draws, the camera transform's rasterizer cost.
//
// The metric: **long-task delta**, not absolute count or FPS. We
// measure the page's idle long-task count first (that captures
// WebGL firmament cost, the rotates animation, etc.), then again
// during interaction. The delta is what the navigation contributes.
// A clean implementation should add few or no long tasks beyond
// the page's resting cost; a regression that blocks the main
// thread on every frame would push the delta way above baseline.
//
// FPS is the metric people reach for first but it's unreliable in
// headless and depends on GPU/display. Long-task delta is honest in
// any environment because it measures *blocking work added*, not
// frame production. CPU-only, software-rasterized headless picks
// up paint cost as long tasks too — that goes into the baseline.
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

async function constellationBounds(page: import('@playwright/test').Page) {
  const box = await page.locator('svg.constellation').boundingBox();
  if (!box) throw new Error('Could not locate constellation SVG');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, w: box.width };
}

function annotate(t: import('@playwright/test').TestInfo, label: string, r: LongTaskReport): void {
  t.annotations.push({
    type: label,
    description: `count=${r.count} longest=${r.longest.toFixed(1)}ms total=${r.total.toFixed(1)}ms`,
  });
}

test.describe('constellation main-thread health', () => {
  test(
    'drag does not add long tasks beyond the page baseline',
    PERF_TAG,
    async ({ page }, info) => {
      await page.goto('/sky');
      await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
      // Let the sky-arrival animation finish.
      await page.waitForTimeout(1800);

      // Baseline: page at rest, just the WebGL firmament + CSS rotation.
      const baseline = await observeLongTasks(page, 2000);
      annotate(info, 'baseline', baseline);

      // Interaction: a continuous 360° drag for 2s.
      const { x, y, w } = await constellationBounds(page);
      const radius = Math.min(w * 0.18, 200);
      await page.mouse.move(x, y);
      await page.mouse.down();
      const dragMeasurement = observeLongTasks(page, 2000);
      const steps = 60;
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        await page.mouse.move(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        await page.waitForTimeout(30);
      }
      await page.mouse.up();
      const drag = await dragMeasurement;
      annotate(info, 'drag', drag);

      // The hook's per-frame cost is microseconds (vitest perf tests).
      // What matters here is that interaction doesn't *add* long tasks
      // beyond the page's resting cost. We allow drag.total to grow
      // by 50% of baseline (generous; a real regression would multiply
      // it). The longest task during drag must not exceed baseline by
      // more than 50ms — a single new blocking frame.
      // Total time is the meaningful aggregate; a regression that
      // blocks every frame would multiply this. We allow the drag's
      // total to grow by 50% of baseline (generous) plus 100ms
      // headroom for browser variance.
      expect(drag.total).toBeLessThan(baseline.total * 1.5 + 100);
      // The longest single task during interaction shouldn't be
      // dramatically longer than baseline's longest. 100ms headroom
      // tolerates one frame of incidental browser work without
      // flaking; an unbounded regression (e.g. an O(N²) loop) would
      // produce tasks well beyond that.
      expect(drag.longest).toBeLessThan(baseline.longest + 100);
    },
  );

  test('flick coast settles without piling up long tasks', PERF_TAG, async ({ page }, info) => {
    await page.goto('/sky');
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    await page.waitForTimeout(1800);

    const baseline = await observeLongTasks(page, 1500);
    annotate(info, 'baseline', baseline);

    const { x, y, w } = await constellationBounds(page);
    const reach = Math.min(w * 0.3, 300);
    await page.mouse.move(x - reach, y);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(x - reach + (reach * 2 * i) / 5, y);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    const coast = await observeLongTasks(page, 1500);
    annotate(info, 'coast', coast);

    expect(coast.total).toBeLessThan(baseline.total * 1.5 + 100);
    expect(coast.longest).toBeLessThan(baseline.longest + 100);
  });
});
