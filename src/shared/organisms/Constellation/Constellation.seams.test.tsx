import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { canonicalSkyGraph, renderSky } from '@/test/sky-fixtures';

// The seams — where one gesture lands while another is still
// unfolding. Each test models a composition the storyboard names
// (CONSTELLATION_STORYBOARD.md) and asserts the contract the CSS
// reads: which star carries data-active, data-here, data-heading,
// data-lit; which thread carries data-active or data-traveling; when
// the frame and the whisper say data-traveling. The sky is a place
// with one attention at a time; these keep it so.

const SMALL_WEATHER = 'garden/small-weather';
const SECOND = 'studio/a-second-work';
const THIRD = 'study/a-third-work';
const LANGUAGE = `${SMALL_WEATHER}|${SECOND}|language`;

function preferReducedMotion() {
  vi.spyOn(globalThis, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true,
      }) as MediaQueryList,
  );
}

const star = (key: string): SVGAElement => {
  const el = document.querySelector<SVGAElement>(`[data-node-key="${key}"] a.constellation-star`);
  if (!el) throw new Error(`no star ${key}`);
  return el;
};

const thread = (id: string): SVGGElement => {
  const el = document.querySelector<SVGGElement>(`g[data-thread="${id}"]`);
  if (!el) throw new Error(`no thread ${id}`);
  return el;
};

const threadHit = (id: string): SVGLineElement => {
  const el = document.querySelector<SVGLineElement>(`line[data-thread-hit="${id}"]`);
  if (!el) throw new Error(`no thread hit ${id}`);
  return el;
};

const sky = (): SVGSVGElement => {
  const el = document.querySelector<SVGSVGElement>('svg.constellation');
  if (!el) throw new Error('no sky');
  return el;
};

const whisper = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>('.sky-whisper');
  if (!el) throw new Error('no whisper');
  return el;
};

/** Where a star sits on the prerendered chart, from its wrapper's
 *  transform — the resting camera's projection. */
function restingPosition(key: string): { x: number; y: number } {
  const wrapper = document.querySelector<SVGGElement>(`[data-node-key="${key}"]`);
  const match = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(wrapper?.getAttribute('transform') ?? '');
  if (!match) throw new Error(`no position for ${key}`);
  return { x: Number(match[1]), y: Number(match[2]) };
}

describe('the seams — hover around a render', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('a breath toward a star claims it and blooms its threads; leaving releases both', async () => {
    const user = userEvent.setup();
    renderSky(canonicalSkyGraph);
    await screen.findByText('the polestar');
    await user.hover(star(SMALL_WEATHER));
    expect(star(SMALL_WEATHER).dataset.active).toBe('true');
    // A hover is a breath, not an arrival: no here, so no rings.
    expect(star(SMALL_WEATHER).dataset.here).toBeUndefined();
    expect(thread(LANGUAGE).dataset.active).toBe('true');
    expect(star(SECOND).dataset.active).toBeUndefined();
    await user.unhover(star(SMALL_WEATHER));
    expect(star(SMALL_WEATHER).dataset.active).toBeUndefined();
    expect(thread(LANGUAGE).dataset.active).toBeUndefined();
  });

  test('tracing a thread lights both its ends and names its facet; the star at one end then takes the claim', async () => {
    const user = userEvent.setup();
    renderSky(canonicalSkyGraph);
    await screen.findByText('the polestar');
    await user.hover(threadHit(LANGUAGE));
    expect(thread(LANGUAGE).dataset.active).toBe('true');
    expect(thread(LANGUAGE).dataset.traced).toBe('true');
    expect(thread(LANGUAGE).querySelector('[data-thread-name]')?.textContent).toBe('language');
    expect(star(SMALL_WEATHER).dataset.lit).toBe('true');
    expect(star(SECOND).dataset.lit).toBe('true');
    expect(star(THIRD).dataset.lit).toBeUndefined();
    // Its figure is attended too: the name at the rim brightens.
    expect(document.querySelector<SVGElement>('[data-compass="language"]')?.dataset.attended).toBe(
      'true',
    );
    // The pointer moves off the line onto the star at its end: the
    // ends' half claim releases and the star's own claim takes over.
    await user.unhover(threadHit(LANGUAGE));
    await user.hover(star(SECOND));
    expect(star(SECOND).dataset.active).toBe('true');
    expect(star(SECOND).dataset.lit).toBeUndefined();
    expect(star(SMALL_WEATHER).dataset.lit).toBeUndefined();
    // The thread blooms for its hovered end, but only a trace names it.
    expect(thread(LANGUAGE).dataset.active).toBe('true');
    expect(thread(LANGUAGE).dataset.traced).toBeUndefined();
  });

  test('a Tab onto a star travels there; focus moving between stars never blinks the claim off', async () => {
    preferReducedMotion();
    const user = userEvent.setup();
    renderSky(canonicalSkyGraph);
    await screen.findByText('the polestar');
    fireEvent.focusIn(star(SECOND));
    await waitFor(() => expect(star(SECOND).dataset.here).toBe('true'));
    expect(star(SECOND).dataset.active).toBe('true');
    // Leaving for another star keeps the claim until the other takes it.
    fireEvent.focusOut(star(SECOND), { relatedTarget: star(SMALL_WEATHER) });
    expect(star(SECOND).dataset.active).toBe('true');
    fireEvent.focusIn(star(SMALL_WEATHER));
    await waitFor(() => expect(star(SMALL_WEATHER).dataset.here).toBe('true'));
    expect(star(SECOND).dataset.here).toBeUndefined();
    // Leaving the stars altogether lets go of the hover's claim; the
    // star you stand at keeps its own.
    await user.hover(star(THIRD));
    expect(star(THIRD).dataset.active).toBe('true');
    fireEvent.focusOut(star(SMALL_WEATHER), { relatedTarget: document.body });
    await waitFor(() => expect(star(THIRD).dataset.active).toBeUndefined());
    expect(star(SMALL_WEATHER).dataset.active).toBe('true');
    expect(star(SMALL_WEATHER).dataset.here).toBe('true');
  });
});

describe('the seams — the crossing', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test(
    'while the sky travels, hover is quiet and the destination is framed ahead; arrival hands the claim to here',
    { timeout: 10_000 },
    async () => {
      const user = userEvent.setup();
      renderSky(canonicalSkyGraph);
      await screen.findByText('the polestar');
      await user.click(star(SECOND));
      // Departure: the frame and the whisper say so; the destination
      // is marked as the heading, not yet as here.
      await waitFor(() => expect(sky().dataset.traveling).toBe('true'));
      expect(whisper().dataset.traveling).toBe('true');
      expect(star(SECOND).dataset.heading).toBe('true');
      expect(star(SECOND).dataset.here).toBeUndefined();
      expect(star(SECOND).dataset.active).toBeUndefined();
      // A star passing under the pointer does not claim.
      await user.hover(star(THIRD));
      expect(star(THIRD).dataset.active).toBeUndefined();
      // Arrival: the heading becomes here; the passing hover was never kept.
      await waitFor(() => expect(star(SECOND).dataset.here).toBe('true'), { timeout: 6000 });
      expect(sky().dataset.traveling).toBeUndefined();
      expect(whisper().dataset.traveling).toBeUndefined();
      expect(star(SECOND).dataset.heading).toBeUndefined();
      expect(star(THIRD).dataset.active).toBeUndefined();
      expect(
        await screen.findByText('a second work', { selector: '.sky-whisper span' }),
      ).toBeVisible();
    },
  );

  test('under reduced motion a travel is an instant arrival: nothing is ever framed ahead', async () => {
    preferReducedMotion();
    const user = userEvent.setup();
    renderSky(canonicalSkyGraph);
    await screen.findByText('the polestar');
    await user.click(star(SECOND));
    await waitFor(() => expect(star(SECOND).dataset.here).toBe('true'));
    expect(sky().dataset.traveling).toBeUndefined();
    expect(star(SECOND).dataset.heading).toBeUndefined();
    // The thread walked is remembered, and the destination's own
    // neighborhood is named.
    await user.click(star(SMALL_WEATHER));
    await waitFor(() => expect(star(SMALL_WEATHER).dataset.here).toBe('true'));
    expect(star(SECOND).dataset.visited).toBe('true');
    expect(star(SECOND).dataset.named).toBe('near');
  });

  test(
    'a press that becomes a drag lets go of the pressed star; the reticle claims, and the sky settles onto it',
    { timeout: 10_000 },
    async () => {
      const user = userEvent.setup();
      renderSky(canonicalSkyGraph);
      await screen.findByText('the polestar');
      const from = restingPosition(THIRD);
      const to = restingPosition(SECOND);
      // Press on the third star, then carry the sky so the second comes
      // to the center of view: the sky follows the hand, so the hand
      // moves by the second star's offset from the center, in reverse.
      await user.pointer({ keys: '[MouseLeft>]', target: star(THIRD), coords: from });
      await user.pointer({
        target: sky(),
        coords: { x: from.x + (500 - to.x), y: from.y + (500 - to.y) },
      });
      await waitFor(() => expect(sky().dataset.scrubbing).toBe('true'));
      // The pressed star holds keyboard focus but no claim; the reticle's
      // star claims without rings.
      expect(star(THIRD).dataset.active).toBeUndefined();
      await waitFor(() => expect(star(SECOND).dataset.active).toBe('true'));
      expect(star(SECOND).dataset.here).toBeUndefined();
      await user.pointer({ keys: '[/MouseLeft]' });
      // Letting go keeps the claim through the settle, then it becomes here.
      expect(star(SECOND).dataset.active).toBe('true');
      await waitFor(() => expect(star(SECOND).dataset.here).toBe('true'), { timeout: 6000 });
      expect(sky().dataset.scrubbing).toBe('false');
      expect(star(THIRD).dataset.active).toBeUndefined();
      expect(
        await screen.findByText('a second work', { selector: '.sky-whisper span' }),
      ).toBeVisible();
    },
  );
});
