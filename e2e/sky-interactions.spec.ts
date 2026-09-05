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

test.describe('the hour’s face', { tag: '@smoke' }, () => {
  test('the daystar is the hour’s toggle: click it and the room turns, and the other face comes round', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await openSkyAtRest(page);
    const daystar = page.getByRole('button', { name: /turn the hour to night/i });
    await expect(daystar).toBeVisible();
    // By day the sun shows and the moon is turned away.
    expect(await opacityOf(page, '.daystar__sun')).toBeGreaterThan(0.9);
    expect(await opacityOf(page, '.daystar__moon')).toBeLessThan(0.1);
    await daystar.click();
    await expect(page.locator('html')).toHaveClass(/dk/);
    await expect(page.getByRole('button', { name: /turn the hour to day/i })).toBeVisible();
    // The magic leaves the turn.
    await expect(page.locator('.daystar__magic')).toHaveCount(1);
    // After the coin has turned, the moon faces out and the sun is away.
    await page.waitForTimeout(1700);
    expect(await opacityOf(page, '.daystar__moon')).toBeGreaterThan(0.9);
    expect(await opacityOf(page, '.daystar__sun')).toBeLessThan(0.1);
  });

  test('the turn is a coin’s: the moon waits for the sun to go edge-on', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await openSkyAtRest(page);
    // Watch from inside the page at frame cadence: when the sun has
    // gone halfway, and when the moon first shows.
    await page.evaluate(() => {
      const w = window as unknown as { __turn: { sunHalf: number; moonRise: number } };
      w.__turn = { sunHalf: -1, moonRise: -1 };
      const t0 = performance.now();
      const sun = document.querySelector('.daystar__sun');
      const moon = document.querySelector('.daystar__moon');
      const sample = () => {
        const t = performance.now() - t0;
        if (sun && w.__turn.sunHalf < 0 && Number(getComputedStyle(sun).opacity) < 0.5) {
          w.__turn.sunHalf = t;
        }
        if (moon && w.__turn.moonRise < 0 && Number(getComputedStyle(moon).opacity) > 0.1) {
          w.__turn.moonRise = t;
        }
        if (t < 3000) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.getByRole('button', { name: /turn the hour to night/i }).click();
    await page.waitForTimeout(3200);
    const turn = await page.evaluate(
      () => (window as unknown as { __turn: { sunHalf: number; moonRise: number } }).__turn,
    );
    expect(turn.sunHalf).toBeGreaterThan(0);
    expect(turn.moonRise).toBeGreaterThan(turn.sunHalf);
    // The rising face waits for the setting one to go edge-on — but no
    // longer: the dead middle of the turn was cut (the fourth pass).
    // The bound is loose: the beats are read at frame cadence, and a
    // busy runner (two projects in parallel) stretches the frames.
    expect(turn.moonRise - turn.sunHalf).toBeGreaterThan(80);
    expect(turn.moonRise).toBeLessThan(1400);
  });

  test('the hour turns through a sunset: the frame carries its dusk for the arc, then rests', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await openSkyAtRest(page);
    const frame = page.locator('nav[aria-labelledby="constellation-title"]');
    expect(await frame.getAttribute('data-dusk')).toBeNull();
    await page.getByRole('button', { name: /turn the hour to night/i }).click();
    await expect(frame).toHaveAttribute('data-dusk', 'true');
    // The sunset's surface flares — gathered at the daystar's seat.
    const dusk = page.locator('.constellation-dusk');
    await expect
      .poll(async () => Number(await dusk.evaluate((el) => getComputedStyle(el).opacity)), {
        timeout: 1500,
      })
      .toBeGreaterThan(0.3);
    await expect(frame).not.toHaveAttribute('data-dusk', 'true', { timeout: 3000 });
    expect(await dusk.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  });

  test('the scarf carries the setting hour’s colors through the first half of the turn, and crosses in the second', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await openSkyAtRest(page);
    // Colors are compared as painted pixels: a pending transition
    // re-serializes the held value into its interpolation space, so
    // the strings differ while the color has not moved.
    await page.evaluate(() => {
      const w = window as unknown as {
        __silk: { day: number[]; early: number[][]; late: number[][] };
        __rgb: (color: string) => number[];
      };
      const ctx = document.createElement('canvas').getContext('2d')!;
      w.__rgb = (color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
      };
      const stop = document.querySelector('#daystar-silk stop')!;
      w.__silk = { day: w.__rgb(getComputedStyle(stop).stopColor), early: [], late: [] };
    });
    await page.evaluate(() => {
      const w = window as unknown as {
        __silk: { day: number[]; early: number[][]; late: number[][] };
        __rgb: (color: string) => number[];
      };
      const stop = document.querySelector('#daystar-silk stop')!;
      const t0 = performance.now();
      const sample = () => {
        const t = performance.now() - t0;
        const rgb = w.__rgb(getComputedStyle(stop).stopColor);
        if (t < 180) w.__silk.early = [...w.__silk.early, rgb];
        if (t > 1300 && t < 1500) w.__silk.late = [...w.__silk.late, rgb];
        if (t < 1600) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.getByRole('button', { name: /turn the hour to night/i }).click();
    await page.waitForTimeout(1800);
    const seen = await page.evaluate(
      () =>
        (window as unknown as { __silk: { day: number[]; early: number[][]; late: number[][] } })
          .__silk,
    );
    const distance = (a: number[], b: number[]) =>
      Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
    // Early, every sample is still the day's color; late, none is near it.
    expect(seen.early.length).toBeGreaterThan(0);
    expect(seen.early.every((rgb) => distance(rgb, seen.day) < 10)).toBe(true);
    expect(seen.late.length).toBeGreaterThan(0);
    expect(seen.late.every((rgb) => distance(rgb, seen.day) > 30)).toBe(true);
  });

  test('looking up from the Foyer lands the daystar in the sky; the nav stays below', async ({
    page,
  }) => {
    await page.goto('/');
    // The nav's glyph carries the name the daystar will take up.
    const glyphName = await page
      .locator('.theme-toggle__glyph')
      .evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(glyphName).toBe('daystar');
    await page.getByRole('link', { name: /look up/i }).click();
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    await expect(page.locator('.theme-toggle__glyph')).toHaveCount(0);
    const daystar = page.locator('[data-daystar]');
    await expect(daystar).toHaveCount(1);
    const daystarName = await daystar.evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(daystarName).toBe('daystar');
    // Seated on the page: in the frame's upper right, clear of the sky's center.
    const box = await daystar.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.x + box!.width / 2).toBeGreaterThan(viewport.width * 0.6);
    expect(box!.y + box!.height / 2).toBeLessThan(viewport.height * 0.4);
  });
});

// The glyph keeps the room's own clean icon (Danny's word, the sixth
// pass); by night it is the far side of the moon, which the ascent
// turns half round to show the face.
test.describe('the glyph', { tag: '@smoke' }, () => {
  test('by night the ascent turns the moon half round: the back turns away, the face comes round', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.goto('/');
    await expect(page.locator('.theme-toggle__glyph svg')).toHaveCount(1);
    const supported = await page.evaluate(() => 'startViewTransition' in document);
    test.skip(!supported, 'no view transitions here');
    await page.evaluate(() => {
      const w = window as unknown as { __turn: string[] };
      w.__turn = [];
      const t0 = performance.now();
      const sample = () => {
        for (const animation of document.getAnimations()) {
          const effect = animation.effect as KeyframeEffect | null;
          const pseudo = effect?.pseudoElement ?? '';
          if (!pseudo.includes('daystar')) continue;
          const turns = effect!
            .getKeyframes()
            .some((frame) => String(frame.transform ?? '').includes('rotateY'));
          if (turns && !w.__turn.includes(pseudo)) w.__turn = [...w.__turn, pseudo];
        }
        if (performance.now() - t0 < 1400) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.getByRole('link', { name: /look up/i }).click();
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    await page.waitForTimeout(1500);
    const turned = await page.evaluate(() => (window as unknown as { __turn: string[] }).__turn);
    expect(turned).toContain('::view-transition-old(daystar)');
    expect(turned).toContain('::view-transition-new(daystar)');
  });
});

// The way down (CONSTELLATION.md §"The Sun and the Moon", the fourth
// pass): the return continues the pull — the room slides up beneath a
// daystar that stays, then the daystar settles into the nav's corner.
// The descent is named on the root while it plays; the choreography
// itself is CSS on that class.
test.describe('the way down', { tag: '@smoke' }, () => {
  test('the return pull names the descent on the root for the transition, then lets it go', async ({
    page,
    isMobile,
  }) => {
    await openSkyAtRest(page);
    await page.evaluate(() => {
      const w = window as unknown as { __descent: { seen: boolean; gone: boolean } };
      w.__descent = { seen: false, gone: false };
      new MutationObserver(() => {
        const has = document.documentElement.classList.contains('descending');
        if (has) w.__descent.seen = true;
        if (w.__descent.seen && !has) w.__descent.gone = true;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    });
    // On the touch project the sphere owns the touch and the wheel is
    // not an instrument; the visible link is the return there.
    if (isMobile) {
      await page.getByRole('link', { name: /return to the foyer/i }).click();
    } else {
      await page.mouse.move(640, 450);
      for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, 60);
        await page.waitForTimeout(40);
      }
    }
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 4000 });
    await expect(page.locator('.theme-toggle__glyph')).toHaveCount(1);
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window as unknown as { __descent: { seen: boolean; gone: boolean } }).__descent,
          ),
        { timeout: 3000 },
      )
      .toEqual({ seen: true, gone: true });
  });

  test('the look-up names the ascent on the root for the lift, then lets it go', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const w = window as unknown as { __ascent: { seen: boolean; gone: boolean } };
      w.__ascent = { seen: false, gone: false };
      new MutationObserver(() => {
        const has = document.documentElement.classList.contains('ascending');
        if (has) w.__ascent.seen = true;
        if (w.__ascent.seen && !has) w.__ascent.gone = true;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    });
    await page.getByRole('link', { name: /look up/i }).click();
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window as unknown as { __ascent: { seen: boolean; gone: boolean } }).__ascent,
          ),
        { timeout: 3000 },
      )
      .toEqual({ seen: true, gone: true });
  });

  test('while the Foyer rests, the sky is readied: its route, its atmosphere, and its magic are fetched with no gesture at all', async ({
    page,
  }) => {
    await page.goto('/');
    const fetched = () =>
      page.evaluate(() => {
        const names = performance.getEntriesByType('resource').map((e) => e.name);
        return {
          renderer: names.some((n) => /atmosphereRenderer/.test(n)),
          magic: names.some((n) => /daystarMagic/.test(n)),
          sky: names.some((n) => /\/assets\/sky-/.test(n)),
        };
      });
    await expect
      .poll(fetched, { timeout: 8000 })
      .toEqual({ renderer: true, magic: true, sky: true });
    // Still on the Foyer: readied, not navigated.
    await expect(page.locator('.theme-toggle__glyph')).toHaveCount(1);
  });

  test('reaching for the sky warms its atmosphere ahead of the look-up', async ({ page }) => {
    await page.goto('/');
    const fetched = () =>
      page.evaluate(() =>
        performance.getEntriesByType('resource').some((e) => /atmosphereRenderer/.test(e.name)),
      );
    expect(await fetched()).toBe(false);
    await page.getByRole('link', { name: /look up/i }).hover();
    await expect.poll(fetched, { timeout: 4000 }).toBe(true);
    // Still on the Foyer: warmed, not navigated.
    await expect(page.locator('.theme-toggle__glyph')).toHaveCount(1);
  });
});

// The magic is a lazy layer (PERFORMANCE_BUDGET.md §"The sky's lazy
// layers"): the scarf's driver and its animation library arrive after
// the page has loaded and gone idle, never ahead of the sky's first
// paint, and never at all when the visitor has asked for less.
test.describe('the magic', { tag: '@smoke' }, () => {
  const SCARF = '.daystar__scarf--front [data-strand="0"]';

  test('the scarf arrives after load and idle, swoops, and brightens under the pointer', async ({
    page,
  }) => {
    await openSkyAtRest(page);
    // The slots are written once the magic has mounted.
    await expect(page.locator(SCARF)).toHaveAttribute('d', /^M /, { timeout: 8000 });
    // Its chunk was fetched after the page had loaded — never ahead of paint.
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const magic = performance
        .getEntriesByType('resource')
        .find((entry) => /daystarMagic-.*\.js/.test(entry.name));
      return { loadEventStart: nav.loadEventStart, magicStart: magic?.startTime ?? -1 };
    });
    expect(timing.magicStart).toBeGreaterThanOrEqual(timing.loadEventStart);
    // Where WebGL is to be had, the body is painted and says so; the
    // drawn disc thins to a wash so the paint shows through the ink.
    const webgl = await page.evaluate(
      () => document.createElement('canvas').getContext('webgl') !== null,
    );
    if (webgl) {
      await expect(page.locator('[data-daystar]')).toHaveClass(/daystar--painted/);
      const discOpacity = await page
        .locator('.daystar__sun .daystar__disc')
        .evaluate((el) => getComputedStyle(el).fillOpacity);
      expect(Number(discOpacity)).toBeLessThan(0.5);
    }
    // It moves on its own.
    const before = await page.locator(SCARF).getAttribute('d');
    await page.waitForTimeout(300);
    expect(await page.locator(SCARF).getAttribute('d')).not.toBe(before);
    // The pointer lends it energy: the glow rises, and falls when it leaves.
    const glow = () =>
      page
        .locator('[data-daystar]')
        .evaluate((el) => Number(el.style.getPropertyValue('--scarf-glow')));
    expect(await glow()).toBeLessThan(0.2);
    await page.locator('[data-daystar]').hover();
    await expect.poll(glow, { timeout: 2000 }).toBeGreaterThan(0.5);
    await page.mouse.move(40, 600);
    await expect.poll(glow, { timeout: 3000 }).toBeLessThan(0.15);
  });

  test('after a turn the scarf slips away, and the pointer’s next visit brings it back', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await openSkyAtRest(page);
    await expect(page.locator(SCARF)).toHaveAttribute('d', /^M /, { timeout: 8000 });
    const presence = () =>
      page
        .locator('[data-daystar]')
        .evaluate((el) => Number(el.style.getPropertyValue('--scarf-presence')));
    expect(await presence()).toBe(1);
    await page.getByRole('button', { name: /turn the hour to night/i }).click();
    await page.mouse.move(40, 600);
    // Seconds later, unnoticed, it is gone — and stays gone.
    await expect.poll(presence, { timeout: 9000 }).toBe(0);
    const gone = await page.locator(SCARF).getAttribute('d');
    await page.waitForTimeout(300);
    expect(await page.locator(SCARF).getAttribute('d')).toBe(gone);
    await page.locator('[data-daystar]').hover();
    await expect.poll(presence, { timeout: 2000 }).toBeGreaterThan(0.9);
  });

  test('a turn whirls the scarf', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });
    await openSkyAtRest(page);
    await expect(page.locator(SCARF)).toHaveAttribute('d', /^M /, { timeout: 8000 });
    const glow = () =>
      page
        .locator('[data-daystar]')
        .evaluate((el) => Number(el.style.getPropertyValue('--scarf-glow')));
    // The click leaves the pointer on the face, whose energy alone
    // lifts the glow to 0.7; the whirl on top of it saturates it.
    await page.getByRole('button', { name: /turn the hour to night/i }).click();
    await expect.poll(glow, { timeout: 1000 }).toBeGreaterThan(0.95);
    await page.mouse.move(40, 600);
    await expect.poll(glow, { timeout: 4000 }).toBeLessThan(0.15);
  });

  test('asked for less — reduced motion, or ?magic=off — the magic never loads', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSkyAtRest(page);
    await page.waitForTimeout(2500);
    expect(await page.locator(SCARF).getAttribute('d')).toBe('');
    const fetched = await page.evaluate(() =>
      performance.getEntriesByType('resource').some((entry) => /daystarMagic/.test(entry.name)),
    );
    expect(fetched).toBe(false);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`${SKY}&magic=off`);
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    await page.waitForTimeout(2500);
    expect(await page.locator(SCARF).getAttribute('d')).toBe('');
  });
});
