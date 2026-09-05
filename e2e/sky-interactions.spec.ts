import { expect, test, type Page } from '@playwright/test';

// The sky's seams, in a real browser. The vitest seams
// (Constellation.seams.test.tsx) pin the contract the CSS reads —
// which star carries which mark, and when. These pin what only a
// layout engine can confirm: that the marks resolve to the register
// the storyboard describes (CONSTELLATION_STORYBOARD.md) — the rings
// held for arrival and silent on a hover, the destination framed
// ahead through a real crossing, a traced thread naming its facet,
// and the sky owning the touch.
//
// Tagged @smoke. The atmosphere is switched off through the perf
// probe's own knob (`?atmosphere=off`): headless Chromium paints
// WebGL in software, which starves the main thread and lets a
// protocol round-trip lose a race with a held-second glide. The
// structural claims under test are the SVG's either way.
//
// Where a beat is transient — the marks during a crossing, the
// whisper's low opacity — it is observed from inside the page at
// frame cadence and asserted afterward, never polled across the
// protocol.

const SKY = '/sky?atmosphere=off';
const STAR = 'svg.constellation a.constellation-star';

const opacityOf = (page: Page, selector: string): Promise<number> =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => Number(getComputedStyle(el).opacity));

async function openSkyAtRest(page: Page) {
  await page.goto(SKY);
  await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
  // Let the stars swell in and the loop settle.
  await page.waitForTimeout(1600);
}

interface CrossingLog {
  readonly marks: readonly string[];
  readonly whisperLow: number;
}

/** Watch the crossing from inside the page: every change of the
 *  travel marks, in order, and the whisper's lowest opacity. */
async function watchCrossing(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __crossing: { marks: string[]; whisperLow: number } };
    w.__crossing = { marks: [], whisperLow: 1 };
    const keyOf = (selector: string) =>
      document.querySelector(selector)?.closest('[data-node-key]')?.getAttribute('data-node-key') ??
      '';
    const sample = () => {
      const traveling =
        document.querySelector('svg.constellation')?.getAttribute('data-traveling') === 'true';
      const whisper = document.querySelector<HTMLElement>('.sky-whisper');
      const whisperTraveling = whisper?.getAttribute('data-traveling') === 'true';
      const mark = `${traveling ? 'T' : '-'}${whisperTraveling ? 'W' : '-'} heading=${keyOf('a[data-heading="true"]')} here=${keyOf('a[data-here="true"]')}`;
      if (w.__crossing.marks.at(-1) !== mark) w.__crossing.marks = [...w.__crossing.marks, mark];
      if (whisper && traveling) {
        w.__crossing.whisperLow = Math.min(
          w.__crossing.whisperLow,
          Number(getComputedStyle(whisper).opacity),
        );
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

const readCrossing = (page: Page): Promise<CrossingLog> =>
  page.evaluate(() => (window as unknown as { __crossing: CrossingLog }).__crossing);

/** A thread whose own hit stroke is what the pointer meets at its
 *  center — the figures cross, and a midpoint can sit under another
 *  line. */
async function traceableThread(page: Page): Promise<string> {
  const id = await page.evaluate(() => {
    const hits = [...document.querySelectorAll<SVGLineElement>('line[data-thread-hit]')];
    const own = hits.find((hit) => {
      const r = hit.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top?.closest('[data-thread]')?.getAttribute('data-thread') === hit.dataset.threadHit;
    });
    return own?.dataset.threadHit ?? null;
  });
  if (!id) throw new Error('no thread meets the pointer at its own midpoint');
  return id;
}

test.describe('the sky’s seams', { tag: '@smoke' }, () => {
  test('a hover claims with halo and gold, never with rings; the rings belong to here', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'a hover is a pointer’s gesture');
    await openSkyAtRest(page);
    const star = page.locator(STAR).nth(1);
    const key = await star.locator('xpath=..').getAttribute('data-node-key');
    await star.hover();
    await expect(star).toHaveAttribute('data-active', 'true');
    await expect(star).not.toHaveAttribute('data-here', 'true');
    await page.waitForTimeout(500);
    const wrapper = `[data-node-key="${key}"]`;
    expect(await opacityOf(page, `${wrapper} .constellation-star__halo`)).toBeGreaterThan(0.4);
    expect(await opacityOf(page, `${wrapper} .constellation-star__echo--1`)).toBe(0);
    // Leaving releases the claim on the vesper's tail.
    await page.mouse.move(2, 2);
    await expect(star).not.toHaveAttribute('data-active', 'true');
  });

  test('naming a destination frames it ahead; arrival hands it the rings', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the crossing is checked with a pointer');
    await openSkyAtRest(page);
    const star = page.locator(STAR).nth(2);
    const key = await star.locator('xpath=..').getAttribute('data-node-key');
    const wrapper = `[data-node-key="${key}"]`;
    await watchCrossing(page);
    await star.click({ force: true });
    await expect(star).toHaveAttribute('data-here', 'true', { timeout: 8000 });
    const { marks, whisperLow } = await readCrossing(page);
    // The beats, in order: at rest at the pole; under way with the
    // destination framed ahead and the whisper low; arrived, with the
    // marks of the crossing lifted.
    expect(marks[0]).toBe('-- heading= here=');
    expect(marks).toContain(`TW heading=${key} here=`);
    expect(marks.at(-1)).toBe(`-- heading= here=${key}`);
    expect(marks.indexOf(`TW heading=${key} here=`)).toBeLessThan(marks.length - 1);
    expect(whisperLow).toBeLessThan(0.5);
    await page.waitForTimeout(900);
    expect(await opacityOf(page, `${wrapper} .constellation-star__echo--1`)).toBeGreaterThan(0.4);
    expect(await opacityOf(page, '.sky-whisper')).toBeGreaterThan(0.9);
  });

  test('tracing a thread names its facet at the midpoint and lights both its ends', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'a trace is a pointer’s gesture');
    await openSkyAtRest(page);
    const id = await traceableThread(page);
    const [source, target] = id.split('|');
    await page.locator(`line[data-thread-hit="${id}"]`).hover({ force: true });
    const group = page.locator(`g[data-thread="${id}"]`);
    await expect(group).toHaveAttribute('data-traced', 'true');
    await expect(group).toHaveAttribute('data-active', 'true');
    await expect(page.locator(`[data-node-key="${source}"] a`)).toHaveAttribute('data-lit', 'true');
    await expect(page.locator(`[data-node-key="${target}"] a`)).toHaveAttribute('data-lit', 'true');
    await page.waitForTimeout(300);
    expect(
      await opacityOf(page, `g[data-thread="${id}"] .constellation-thread__name`),
    ).toBeGreaterThan(0.7);
    // Only the traced thread names itself: no other name is showing.
    const named = await page
      .locator('.constellation-thread__name')
      .evaluateAll((els) => els.filter((el) => Number(getComputedStyle(el).opacity) > 0.1).length);
    expect(named).toBe(1);
  });

  test('the sky owns the touch', async ({ page }) => {
    await openSkyAtRest(page);
    const touchAction = await page
      .locator('svg.constellation')
      .evaluate((el) => getComputedStyle(el).touchAction);
    expect(touchAction).toBe('none');
  });
});
