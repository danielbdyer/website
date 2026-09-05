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
    // The link lifts first: the room turns about the eye, live, before
    // the sky route arrives beneath it. Recorded as it plays (software
    // GL paints the dome slowly while the eye moves, so a poll after
    // the fact can miss the whole lift).
    await page.evaluate(() => {
      const w = window as unknown as { __lift: { reveal: number; turned: boolean } };
      w.__lift = { reveal: 0, turned: false };
      new MutationObserver(() => {
        const root = document.documentElement;
        w.__lift.reveal = Math.max(
          w.__lift.reveal,
          Number(root.style.getPropertyValue('--reveal')) || 0,
        );
        const room = document.querySelector('.site-room:not(.site-room--sky)');
        if (room && getComputedStyle(room).transform.startsWith('matrix3d')) {
          w.__lift.turned = true;
        }
      }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    });
    await page.getByRole('link', { name: /look up/i }).click();
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    const lift = await page.evaluate(
      () => (window as unknown as { __lift: { reveal: number; turned: boolean } }).__lift,
    );
    expect(lift.reveal).toBeGreaterThan(1);
    expect(lift.turned).toBe(true);
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
      // Read the transition's animations once it is ready, rather than
      // sampling frames: the lift plays for 900 ms first, and software
      // GL can starve a frame sampler through the whole transition.
      const doc = document as Document & {
        startViewTransition: (cb: () => void | Promise<void>) => ViewTransition;
      };
      const original = doc.startViewTransition.bind(doc);
      doc.startViewTransition = (cb) => {
        const transition = original(cb);
        void transition.ready.then(() => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null;
            const pseudo = effect?.pseudoElement ?? '';
            if (!pseudo.includes('daystar')) continue;
            const turns = effect!
              .getKeyframes()
              .some((frame) => String(frame.transform ?? '').includes('rotateY'));
            if (turns && !w.__turn.includes(pseudo)) w.__turn = [...w.__turn, pseudo];
          }
        });
        return transition;
      };
    });
    await page.getByRole('link', { name: /look up/i }).click();
    await page.locator('nav[aria-labelledby="constellation-title"]').waitFor();
    await page.waitForTimeout(1500);
    const turned = await page.evaluate(() => (window as unknown as { __turn: string[] }).__turn);
    expect(turned).toContain('::view-transition-old(daystar)');
    expect(turned).toContain('::view-transition-new(daystar)');
  });
});

// The daystar's seat (CONSTELLATION.md §"The Sun and the Moon", the
// ninth pass and the tenth): the glyph is left alone at the start and
// falls with the page; the moon appears in the sky a little before the
// route changes, at exactly where the sky seats the daystar, and the
// transition turns it into the face there; on the way down the face
// flies to exactly where the glyph rests and resolves into it.
test.describe('the seat', { tag: '@smoke' }, () => {
  test('the glyph is left alone at the start; the moon is already in the sky, where the daystar will be, when the route changes', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.goto('/');
    await expect(page.locator('.theme-toggle__glyph')).toHaveCSS('view-transition-name', 'daystar');
    await expect(page.locator('.daystar-seat')).toBeHidden();
    await page.evaluate(() => {
      const w = window as unknown as {
        __seat: { appearedAt: number | null; atStart: Record<string, unknown> };
      };
      w.__seat = { appearedAt: null, atStart: {} };
      // The reveal at which the seat first appears: not at the start.
      new MutationObserver(() => {
        if (w.__seat.appearedAt !== null) return;
        if (!document.documentElement.classList.contains('daystar-seated')) return;
        w.__seat.appearedAt = Number(document.documentElement.style.getPropertyValue('--reveal'));
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      // Recorded at the moment the transition begins.
      const doc = document as Document & {
        startViewTransition: (cb: () => void | Promise<void>) => ViewTransition;
      };
      const original = doc.startViewTransition.bind(doc);
      doc.startViewTransition = (cb) => {
        const seat = document.querySelector('.daystar-seat');
        const glyph = document.querySelector('.theme-toggle__glyph');
        w.__seat.atStart = {
          seated: document.documentElement.classList.contains('daystar-seated'),
          seatName: seat ? getComputedStyle(seat).viewTransitionName : null,
          seatOpacity: seat ? Number(getComputedStyle(seat).opacity) : null,
          glyphName: glyph ? getComputedStyle(glyph).viewTransitionName : null,
          rect: seat ? seat.getBoundingClientRect().toJSON() : null,
        };
        return original(cb);
      };
    });
    await page.getByRole('link', { name: /look up/i }).click();
    const daystar = page.locator('[data-daystar]');
    await daystar.waitFor();
    const seat = await page.evaluate(
      () =>
        (
          window as unknown as {
            __seat: {
              appearedAt: number | null;
              atStart: {
                seated: boolean;
                seatName: string;
                seatOpacity: number;
                glyphName: string;
                rect: { x: number; y: number; width: number; height: number };
              };
            };
          }
        ).__seat,
    );
    expect(seat.appearedAt).not.toBeNull();
    expect(seat.appearedAt!).toBeGreaterThan(0.6);
    expect(seat.atStart.seated).toBe(true);
    expect(seat.atStart.seatName).toBe('daystar');
    expect(seat.atStart.seatOpacity).toBeGreaterThan(0.98);
    expect(seat.atStart.glyphName).toBe('none');
    // The seat's center is the daystar's center, its size the face's.
    const box = (await daystar.boundingBox())!;
    const r = seat.atStart.rect;
    expect(Math.abs(r.x + r.width / 2 - (box.x + box.width / 2))).toBeLessThan(4);
    expect(Math.abs(r.y + r.height / 2 - (box.y + box.height / 2))).toBeLessThan(4);
    expect(r.width / box.width).toBeGreaterThan(0.6);
    expect(r.width / box.width).toBeLessThan(0.75);
  });

  test('on the way down the face flies to exactly where the glyph rests, and the glyph has its place back once it has landed', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.goto('/');
    await page.getByRole('link', { name: /look up/i }).click();
    await page.locator('[data-daystar]').waitFor();
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const w = window as unknown as {
        __land: { seatRect: DOMRect | null; flightEnd: Record<string, string> | null };
      };
      w.__land = { seatRect: null, flightEnd: null };
      new MutationObserver(() => {
        if (w.__land.seatRect) return;
        if (!document.documentElement.classList.contains('daystar-seated')) return;
        const seat = document.querySelector('.daystar-seat');
        if (seat) w.__land.seatRect = seat.getBoundingClientRect().toJSON();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      const doc = document as Document & {
        startViewTransition: (cb: () => void | Promise<void>) => ViewTransition;
      };
      const original = doc.startViewTransition.bind(doc);
      doc.startViewTransition = (cb) => {
        const transition = original(cb);
        void transition.ready.then(() => {
          const group = document
            .getAnimations()
            .map((a) => a.effect as KeyframeEffect | null)
            .find((e) => e?.pseudoElement === '::view-transition-group(daystar)');
          const last = group?.getKeyframes().at(-1);
          if (last) {
            w.__land.flightEnd = {
              transform: String(last.transform),
              width: String(last.width),
            };
          }
        });
        return transition;
      };
    });
    await page.getByRole('link', { name: /return to the foyer/i }).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 4000 });
    // Landed: the seat gone, the glyph visible and named again.
    await expect(page.locator('html')).not.toHaveClass(/daystar-seated/, { timeout: 20_000 });
    await expect(page.locator('.theme-toggle__glyph')).toHaveCSS('view-transition-name', 'daystar');
    await expect(page.locator('.theme-toggle__glyph')).toHaveCSS('opacity', '1');
    await expect(page.locator('.daystar-seat')).toBeHidden();
    const land = await page.evaluate(
      () =>
        (
          window as unknown as {
            __land: {
              seatRect: { x: number; y: number; width: number; height: number } | null;
              flightEnd: { transform: string; width: string } | null;
            };
          }
        ).__land,
    );
    // The seat stood at the glyph's own rest from the first paint …
    const glyphIcon = (await page.locator('.theme-toggle__glyph svg').boundingBox())!;
    expect(land.seatRect).not.toBeNull();
    expect(Math.abs(land.seatRect!.x - glyphIcon.x)).toBeLessThan(2);
    expect(Math.abs(land.seatRect!.y - glyphIcon.y)).toBeLessThan(2);
    expect(Math.abs(land.seatRect!.width - glyphIcon.width)).toBeLessThan(2);
    // … and the transition's flight ended exactly there.
    if (land.flightEnd) {
      const end = /matrix\(1, 0, 0, 1, ([-\d.]+), ([-\d.]+)\)/.exec(land.flightEnd.transform);
      expect(end).not.toBeNull();
      expect(Math.abs(Number(end![1]) - glyphIcon.x)).toBeLessThan(2);
      expect(Math.abs(Number(end![2]) - glyphIcon.y)).toBeLessThan(2);
      expect(Math.abs(Number.parseFloat(land.flightEnd.width) - glyphIcon.width)).toBeLessThan(2);
    }
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
        { timeout: 15_000 },
      )
      .toEqual({ seen: true, gone: true });
  });

  test('the way down keeps the sky: the same canvas is handed back to the backdrop and the room settles beneath it', async ({
    page,
  }) => {
    await page.goto('/');
    const webgl = await page.evaluate(
      () => document.createElement('canvas').getContext('webgl') !== null,
    );
    test.skip(!webgl, 'no WebGL here');
    const readied = page.locator('.sky-backdrop canvas[data-prepared]');
    await expect(readied).toHaveCount(1, { timeout: 10_000 });
    await readied.evaluate((el) => {
      el.dataset.roundTrip = 'the-same';
    });
    await page.getByRole('link', { name: /look up/i }).click();
    const frame = page.locator('nav[aria-labelledby="constellation-title"]');
    await frame.waitFor();
    await expect(frame.locator('.webgl-firmament canvas[data-round-trip="the-same"]')).toHaveCount(
      1,
    );
    await page.evaluate(() => {
      const w = window as unknown as { __settle: { seen: boolean } };
      w.__settle = { seen: false };
      new MutationObserver(() => {
        if (document.documentElement.classList.contains('pulling')) w.__settle.seen = true;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    });
    await page.getByRole('link', { name: /return to the foyer/i }).click();
    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 4000 });
    // The very same canvas, back in the backdrop at once — handed back,
    // not a fresh one made at idle — and the room settling in beneath it.
    await expect(page.locator('.sky-backdrop canvas[data-round-trip="the-same"]')).toHaveCount(1, {
      timeout: 15_000,
    });
    await expect
      .poll(
        () =>
          page.evaluate(() => (window as unknown as { __settle: { seen: boolean } }).__settle.seen),
        { timeout: 15_000 },
      )
      .toBe(true);
    await expect(page.locator('html')).not.toHaveClass(/pulling/, { timeout: 20_000 });
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

  test('a pull tilts the room away over the backdrop, and a release settles it back', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the wheel is a pointer’s instrument');
    await page.goto('/');
    const room = page.locator('.site-room');
    expect(await room.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    await page.mouse.move(640, 400);
    // Two small notches: a gathering, well short of the threshold.
    await page.mouse.wheel(0, -40);
    await page.waitForTimeout(30);
    await page.mouse.wheel(0, -40);
    await expect(page.locator('html')).toHaveClass(/pulling/);
    await expect
      .poll(() => room.evaluate((el) => getComputedStyle(el).transform), { timeout: 12_000 })
      .not.toBe('none');
    await expect(page.locator('.sky-backdrop')).toBeVisible();
    // Released, the room settles and the backdrop hides again. (Software
    // GL paints the dome slowly while the eye moves; the wait is long.)
    await expect(page.locator('html')).not.toHaveClass(/pulling/, { timeout: 20_000 });
    await expect(page.locator('.sky-backdrop')).toBeHidden();
    expect(await room.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    // Still the Foyer.
    await expect(page.locator('.theme-toggle__glyph')).toHaveCount(1);
  });

  test('the sky painted behind the room is the very sky the look-up arrives in', async ({
    page,
  }) => {
    await page.goto('/');
    const webgl = await page.evaluate(
      () => document.createElement('canvas').getContext('webgl') !== null,
    );
    test.skip(!webgl, 'no WebGL here');
    // Readied at idle: the prepared atmosphere's canvas sits in the backdrop.
    await expect(page.locator('.sky-backdrop canvas[data-prepared]')).toHaveCount(1, {
      timeout: 10_000,
    });
    await page.getByRole('link', { name: /look up/i }).click();
    const frame = page.locator('nav[aria-labelledby="constellation-title"]');
    await frame.waitFor();
    // Adopted whole: the same canvas, claimed at once, no chart beneath.
    await expect(frame.locator('.webgl-firmament canvas[data-prepared]')).toHaveCount(1);
    await expect(frame).toHaveAttribute('data-atmosphere', 'webgl');
    await expect(frame).toHaveAttribute('data-atmosphere-adopted', 'true');
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
