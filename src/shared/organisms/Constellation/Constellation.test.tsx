import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createMemoryHistory,
} from '@tanstack/react-router';
import { axe } from '@/test/axe';
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
  return render(<RouterProvider router={router} />);
}

const SAMPLE_GRAPH: ConstellationGraph = {
  facetHues: {
    craft: 'warm',
    body: 'warm',
    beauty: 'rose',
    language: 'rose',
    consciousness: 'violet',
    becoming: 'violet',
    leadership: 'gold',
    relation: 'gold',
  },
  nodes: [
    {
      room: 'garden',
      slug: 'small-weather',
      title: 'small weather',
      date: new Date('2026-04-24'),
      facets: ['relation', 'body', 'becoming', 'language'],
      posture: undefined,
      isPreview: false,
      angleDeg: 135,
      radius: 0.6,
      hue: 'gold',
      twinklePhase: 1.2,
    },
    {
      room: 'studio',
      slug: 'a-second-work',
      title: 'a second work',
      date: new Date('2026-05-01'),
      facets: ['language', 'craft'],
      posture: undefined,
      isPreview: false,
      angleDeg: 225,
      radius: 0.7,
      hue: 'rose',
      twinklePhase: 3.4,
    },
  ],
  edges: [
    {
      facet: 'language',
      hue: 'rose',
      source: { room: 'garden', slug: 'small-weather' },
      target: { room: 'studio', slug: 'a-second-work' },
    },
  ],
};

const EMPTY_GRAPH: ConstellationGraph = {
  facetHues: SAMPLE_GRAPH.facetHues,
  nodes: [],
  edges: [],
};

describe('Constellation organism', () => {
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

  test('honors the empty Foyer — zero nodes is a real empty set', async () => {
    renderConstellation(EMPTY_GRAPH);
    const nav = await screen.findByRole('navigation', { name: /constellation/i });
    expect(nav).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    // Heading announces the count honestly — empty is empty.
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/0 works/);
  });

  test('has no axe-detectable violations on a populated sky', async () => {
    const { container } = renderConstellation(SAMPLE_GRAPH);
    await screen.findByRole('link', { name: /small weather/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
