import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { WorkView } from './WorkView';

function makeWork(overrides: Partial<Work> = {}): Work {
  return {
    title: 'A Working Title',
    date: new Date('2026-03-14'),
    facets: [],
    draft: false,
    room: 'garden',
    slug: 'a-working-title',
    body: 'The first paragraph.\n\nThe second paragraph.',
    ...overrides,
  };
}

function renderWork(work: Work) {
  const rootRoute = createRootRoute({ component: () => <WorkView work={work} /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('WorkView', () => {
  it('renders the title, formatted date, and body paragraphs', async () => {
    renderWork(makeWork());
    expect(await screen.findByRole('heading', { name: 'A Working Title' })).toBeInTheDocument();
    expect(screen.getByText('March 14, 2026')).toBeInTheDocument();
    expect(screen.getByText('The first paragraph.')).toBeInTheDocument();
    expect(screen.getByText('The second paragraph.')).toBeInTheDocument();
  });

  it('renders facet chips when facets are present', async () => {
    renderWork(makeWork({ facets: ['craft', 'language'] }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    expect(screen.getByText('craft')).toBeInTheDocument();
    expect(screen.getByText('language')).toBeInTheDocument();
  });

  it('renders no chip row when facets is empty', async () => {
    const { container } = renderWork(makeWork({ facets: [] }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    // No span with the tag-bg class should exist
    expect(container.querySelector('.bg-\\[var\\(--tag-bg\\)\\]')).toBeNull();
  });

  it('renders the summary when present, omits it otherwise', async () => {
    const { rerender } = renderWork(makeWork({ summary: 'A short line for lists.' }));
    expect(await screen.findByText('A short line for lists.')).toBeInTheDocument();

    const rootRoute = createRootRoute({ component: () => <WorkView work={makeWork()} /> });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    rerender(<RouterProvider router={router} />);
    expect(screen.queryByText('A short line for lists.')).not.toBeInTheDocument();
  });

  it('links the kicker and the outward invitation back to the work\'s room', async () => {
    renderWork(makeWork({ room: 'garden' }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    const kicker = screen.getByRole('link', { name: /← The Garden/ });
    const outward = screen.getByRole('link', { name: /Keep wandering in The Garden/ });
    expect(kicker).toHaveAttribute('href', '/garden');
    expect(outward).toHaveAttribute('href', '/garden');
  });

  it('renders markdown headings and emphasis', async () => {
    renderWork(
      makeWork({
        body: '## A Heading\n\nA paragraph with *italic* text.',
      }),
    );
    await screen.findByRole('heading', { name: 'A Working Title' });
    expect(screen.getByRole('heading', { name: 'A Heading' })).toBeInTheDocument();
    expect(screen.getByText('italic').tagName).toBe('EM');
  });
});
