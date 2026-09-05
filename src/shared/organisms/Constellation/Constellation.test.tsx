import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createMemoryHistory,
} from '@tanstack/react-router';
import { axe } from '@/test/axe';
import { figure, sky, star } from '@/test/sky-graph';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { Constellation } from './Constellation';

// Mount the Constellation under a minimal in-memory router so the
// link-delegation hook has the router context it needs.
function renderConstellation(graph: ConstellationGraph) {
  const rootRoute = createRootRoute({
    component: () => <Constellation graph={graph} />,
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return { router, ...render(<RouterProvider router={router} />) };
}

const SAMPLE_GRAPH = sky(
  [
    star('garden/small-weather', ['relation', 'body', 'becoming', 'language'], 135, 0.6, {
      title: 'small weather',
      date: new Date('2026-04-24'),
      twinklePhase: 1.2,
    }),
    star('studio/a-second-work', ['language', 'craft'], 225, 0.7, {
      title: 'a second work',
      date: new Date('2026-05-01'),
      twinklePhase: 3.4,
    }),
  ],
  [figure('garden/small-weather', 'studio/a-second-work', 'language')],
);

const EMPTY_GRAPH = sky([], []);

/** A sky cut from another source: claims with no pages and their own
 *  compass — the slice the book's vault becomes. */
const CLAIM_GRAPH: ConstellationGraph = {
  axes: [
    {
      id: 'recognition',
      name: 'recognition',
      azimuthDeg: 0,
      hue: 'warm',
      dotted: false,
      rim: { x: 1, y: 0, z: 0 },
    },
    {
      id: 'felt-shift',
      name: 'felt-shift',
      azimuthDeg: 180,
      hue: 'violet',
      dotted: false,
      rim: { x: -1, y: 0, z: 0 },
    },
  ],
  nodes: [
    star('reading is remembering', ['recognition'], 0, 0.5, { kind: 'claim' }),
    star('a claim counts when it checks out somatically', ['felt-shift'], 180, 0.5, {
      kind: 'claim',
    }),
  ],
  edges: [],
};

/** Reduced motion makes travel an instant arrival, which lets the
 *  walk's consequences be asserted synchronously. */
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

describe('Constellation organism', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders a star for every node, addressable by sky-overlay URL', async () => {
    // Stars open as overlays inside /sky, so their hrefs follow the
    // /sky/{room}/{slug} pattern; the work-page route at
    // /{room}/{slug} remains independently addressable for direct
    // links from outside the sky.
    renderConstellation(SAMPLE_GRAPH);
    expect(await screen.findByRole('link', { name: /small weather/i })).toHaveAttribute(
      'href',
      '/sky/garden/small-weather',
    );
    expect(await screen.findByRole('link', { name: /a second work/i })).toHaveAttribute(
      'href',
      '/sky/studio/a-second-work',
    );
  });

  test('renders one thread element per edge (selecting by data-thread-id)', async () => {
    const { container } = renderConstellation(SAMPLE_GRAPH);
    await screen.findByRole('link', { name: /small weather/i });
    expect(container.querySelectorAll('line[data-thread-id]')).toHaveLength(1);
  });

  test('letters the compass at the rim; a small sky is wholly present', async () => {
    const { container } = renderConstellation(SAMPLE_GRAPH);
    await screen.findByRole('link', { name: /small weather/i });
    expect(container.querySelectorAll('[data-compass]')).toHaveLength(8);
    expect(container.querySelectorAll('.constellation-star[data-present="true"]')).toHaveLength(2);
  });

  test('hovering a star lights it and its thread on the page, and leaving clears them', async () => {
    const user = userEvent.setup();
    const { container } = renderConstellation(SAMPLE_GRAPH);
    const star = await screen.findByRole('link', { name: /small weather/i });
    await user.hover(star);
    expect(star).toHaveAttribute('data-hover', 'true');
    expect(container.querySelector('[data-thread][data-hover="true"]')).not.toBeNull();
    await user.unhover(star);
    expect(star).not.toHaveAttribute('data-hover');
    expect(container.querySelector('[data-thread][data-hover="true"]')).toBeNull();
  });

  test('opens at the pole and whispers the bearings that lead away', async () => {
    renderConstellation(SAMPLE_GRAPH);
    expect(await screen.findByText('the polestar')).toBeInTheDocument();
    // Every axis is a bearing at the pole; the ones no star carries
    // yet are present but disabled.
    expect(screen.getByRole('button', { name: /travel along language/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /beauty: nothing yet/i })).toBeDisabled();
  });

  test('clicking a star you are not at travels to it instead of opening it', async () => {
    preferReducedMotion();
    const user = userEvent.setup();
    const { router } = renderConstellation(SAMPLE_GRAPH);
    const star = await screen.findByRole('link', { name: /a second work/i });
    await user.click(star);
    // Arrived: the whisper now says where you stand, the star is the
    // current location, and the router did not navigate.
    expect(
      await screen.findByText('a second work', { selector: '.sky-whisper span' }),
    ).toBeVisible();
    expect(screen.getByText('The Studio')).toBeInTheDocument();
    expect(star).toHaveAttribute('aria-current', 'location');
    expect(router.state.location.pathname).toBe('/');
  });

  test('taking a bearing from the whisper travels along it', async () => {
    preferReducedMotion();
    const user = userEvent.setup();
    renderConstellation(SAMPLE_GRAPH);
    await screen.findByText('the polestar');
    await user.click(screen.getByRole('button', { name: /travel along craft/i }));
    // craft's only star is the second work.
    expect(
      await screen.findByText('a second work', { selector: '.sky-whisper span' }),
    ).toBeVisible();
    // Standing at a star, the bearings are its own axes.
    expect(screen.getByRole('button', { name: /travel along language/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /relation/i })).toBeNull();
  });

  test('draws a sky cut from another source: its own compass, stars without pages', async () => {
    const { container } = renderConstellation(CLAIM_GRAPH);
    const claim = await screen.findByRole('button', { name: /reading is remembering/i });
    expect(claim).not.toHaveAttribute('href');
    expect(claim).toHaveAttribute('tabindex', '0');
    expect(container.querySelectorAll('[data-compass]')).toHaveLength(2);
    expect(container.querySelector('[data-compass="felt-shift"]')?.textContent).toBe('felt-shift');
    expect(screen.getByRole('button', { name: /travel along recognition/i })).toBeEnabled();
  });

  test('honors the empty Foyer — zero nodes is a real empty set', async () => {
    renderConstellation(EMPTY_GRAPH);
    const nav = await screen.findByRole('navigation', { name: /constellation/i });
    expect(nav).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    // Heading announces the count honestly — empty is empty.
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/0 stars/);
  });

  test('has no axe-detectable violations on a populated sky', async () => {
    const { container } = renderConstellation(SAMPLE_GRAPH);
    await screen.findByRole('link', { name: /small weather/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
