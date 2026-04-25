import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { marked } from 'marked';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { axe } from '@/test/axe';
import type { Work } from '@/shared/content/schema';
import { WorkView } from './WorkView';

function makeWork(overrides: Partial<Work> = {}): Work {
  const body = overrides.body ?? 'The first paragraph.\n\nThe second paragraph.';
  const html = overrides.html ?? marked.parse(body, { async: false });
  return {
    title: 'A Working Title',
    date: new Date('2026-03-14'),
    facets: [],
    draft: false,
    room: 'garden',
    slug: 'a-working-title',
    ...overrides,
    body,
    html,
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
    expect(container.querySelector('.facet-chip')).toBeNull();
  });

  // Per the design (chats/chat1.md), the work page does NOT show the
  // summary — summary lives in the room listing. The page's job is to be
  // read; the chrome's job is to get out of the way.
  it('does not render the summary on the work page', async () => {
    renderWork(makeWork({ summary: 'A short line for lists.' }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    expect(screen.queryByText('A short line for lists.')).not.toBeInTheDocument();
  });

  it("links the kicker and the outward invitation back to the work's room", async () => {
    renderWork(makeWork({ room: 'garden' }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    const kicker = screen.getByRole('link', { name: /← The Garden/ });
    const outward = screen.getByRole('link', { name: 'The Garden' });
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

  it('has no accessibility violations', async () => {
    const { container } = renderWork(makeWork({ facets: ['craft'], summary: 'A line.' }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('shows a DRAFT indicator in dev when work.draft is true', async () => {
    renderWork(makeWork({ draft: true }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });

  it('does not show the DRAFT indicator when work.draft is false', async () => {
    renderWork(makeWork({ draft: false }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    expect(screen.queryByText(/^draft\s*$/i)).not.toBeInTheDocument();
  });
});
