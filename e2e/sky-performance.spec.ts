import { expect, test } from '@playwright/test';

// Frame-rate guards for the constellation's navigation surface. The
// vitest perf tests cover the JS hot path (basin field, nearest
// node, etc.) but cannot see what a real browser does — paint,
// composite, the WebGL firmament, the camera transform's effect on
// the rasterizer. These tests run in a real Chromium and count RAF
// frames during interaction so the full pipeline is honoured.
//
// Tagged @perf rather than @smoke so they're an opt-in gate (run via
// `pnpm test:e2e --grep @perf`). They're not CI-blocking by default
// because frame timings vary across machines and headless modes.

const PERF_TAG = { tag: '@perf' as const };

interface FpsMeasurement {
  frames: number;
  elapsed: number;
}

// Counts RAF callbacks inside the page over `durationMs`. The
// counter runs through requestAnimationFrame independently of the
// navigation hook's loop, so it keeps firing even if the hook's
// own RAF idles — what we measure is the browser's frame cadence
// during the interaction window.
async function countFrames(
  page: import('@playwright/test').Page,
  durationMs: number,
): Promise<FpsMeasurement> {
  return await page.evaluate((duration: number) => {
    return new Promise<FpsMeasurement>((resolve) => {
      let frames = 0;
      const start = performance.now();
      const finish = start + duration;
      function tick() {
        frames += 1;
        if (performance.now() < finish) {
          requestAnimationFrame(tick);
        } else {
          resolve({ frames, elapsed: performance.now() - start });
        }
      }
      requestAnimationFrame(tick);
    });
  }, durationMs);
}

async function constellationBounds(page: import('@playwright/test').Page) {
  const box = await page.locator('svg.constellation').boundingBox();
  if (!box) throw new Error('Could not locate constellation SVG');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, w: box.width };
}

test.describe('constellation frame cadence', () => {
  test('idle /sky paints at near display rate', PERF_TAG, async ({ page }) => {
    await page.goto('/sky');
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    // Let the sky-arrival animation finish so we're not measuring
    // its frames specifically.
    await page.waitForTimeout(1800);
    const { frames, elapsed } = await countFrames(page, 1500);
    const fps = (frames / elapsed) * 1000;
    test.info().annotations.push({ type: 'fps-idle', description: fps.toFixed(1) });
    // Idle: the page is mostly composited frames; 50fps headroom is
    // generous against CI variance.
    expect(fps).toBeGreaterThan(50);
  });

  test('continuous pointer drag holds frame rate', PERF_TAG, async ({ page }) => {
    await page.goto('/sky');
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    await page.waitForTimeout(1500);
    const { x, y, w } = await constellationBounds(page);
    const radius = Math.min(w * 0.18, 200);

    await page.mouse.move(x, y);
    await page.mouse.down();
    const fpsPromise = countFrames(page, 2000);

    // Drive a 360° drag over the measurement window. ~30Hz move
    // rate matches a typical pointermove cadence.
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      await page.mouse.move(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      await page.waitForTimeout(30);
    }
    const { frames, elapsed } = await fpsPromise;
    await page.mouse.up();

    const fps = (frames / elapsed) * 1000;
    test.info().annotations.push({ type: 'fps-drag', description: fps.toFixed(1) });
    // Drag exercises pointermove → drag spring → camera transform
    // every frame. 45fps is the floor for "feels smooth" on the
    // perceptual side; we hold to that.
    expect(fps).toBeGreaterThan(45);
  });

  test('flick coast holds frame rate', PERF_TAG, async ({ page }) => {
    await page.goto('/sky');
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    await page.waitForTimeout(1500);
    const { x, y, w } = await constellationBounds(page);
    const reach = Math.min(w * 0.3, 300);

    // Quick, hard flick — five fast moves over ~80ms imparts the
    // velocity buffer the hook samples on release.
    await page.mouse.move(x - reach, y);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(x - reach + (reach * 2 * i) / 5, y);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();

    // Measure during the coast; the cursor should drift through
    // basins until friction settles it.
    const { frames, elapsed } = await countFrames(page, 1200);
    const fps = (frames / elapsed) * 1000;
    test.info().annotations.push({ type: 'fps-coast', description: fps.toFixed(1) });
    expect(fps).toBeGreaterThan(50);
  });
});
