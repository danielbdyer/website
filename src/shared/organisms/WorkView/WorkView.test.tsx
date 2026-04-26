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
import type { DisplayWork } from '@/shared/content/preview';
import { WorkView } from './WorkView';

function makeWork(overrides: Partial<DisplayWork> = {}): DisplayWork {
  const body = overrides.body ?? 'The first paragraph.\n\nThe second paragraph.';
  const html = overrides.html ?? marked.parse(body, { async: false });
  return {
    title: 'A Working Title',
    date: new Date('2026-03-14T12:00:00Z'),
    facets: [],
    feature: false,
    draft: false,
    backlinks: [],
    room: 'garden',
    slug: 'a-working-title',
    ...overrides,
    body,
    html,
  };
}

function renderWork(work: DisplayWork) {
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
    // The chip row at the top — scoped to the facets region. The bottom
    // outward invitation also renders the facet names as inline links;
    // those are the *threads* line, not chips.
    const chipRow = screen.getByLabelText('Facets');
    expect(chipRow).toContainElement(screen.getAllByText('craft')[0]!);
    expect(chipRow).toContainElement(screen.getAllByText('language')[0]!);
  });

  it('renders no chip row when facets is empty', async () => {
    renderWork(makeWork({ facets: [] }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    expect(screen.queryByLabelText('Facets')).not.toBeInTheDocument();
  });

  // Per INFORMATION_ARCHITECTURE.md §"Anatomy" and §"What work pages do
  // not carry", the work page does NOT show the summary — summary lives
  // in the room listing. The page's job is to be read; the chrome's job
  // is to get out of the way.
  it('does not render the summary on the work page', async () => {
    renderWork(makeWork({ summary: 'A short line for lists.' }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    expect(screen.queryByText('A short line for lists.')).not.toBeInTheDocument();
  });

  // Per CONTENT_SCHEMA.md §"Content types": poems render with a
  // narrower measure and serif-forward treatment. The `.prose-poem`
  // variant carries that; non-poem types stay with the base `.prose`
  // register. The class's presence is what surfaces the variant; the
  // typography decisions live in tokens.css.
  it('applies the prose-poem variant when the work is a poem', async () => {
    const { container } = renderWork(makeWork({ type: 'poem' }));
    await screen.findByRole('heading', { name: 'A Working Title' });
    const body = container.querySelector('.prose');
    expect(body).not.toBeNull();
    expect(body?.classList.contains('prose-poem')).toBe(true);
  });

  it('does not apply prose-poem to essays, case studies, or notes', async () => {
    for (const type of ['essay', 'case-study', 'note'] as const) {
      const { container, unmount } = renderWork(makeWork({ type }));
      await screen.findByRole('heading', { name: 'A Working Title' });
      const body = container.querySelector('.prose');
      expect(body).not.toBeNull();
      expect(body?.classList.contains('prose-poem')).toBe(false);
      unmount();
    }
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

  it('renders a preview note when the work is sample content', async () => {
    renderWork(
      makeWork({
        preview: {
          kind: 'sample',
          roomNote: '[Sample preview entries fill this room until authored works arrive.]',
          workNote: '[Sample preview only. It disappears as soon as this room has authored work.]',
        },
      }),
    );
    await screen.findByRole('heading', { name: 'A Working Title' });
    expect(screen.getByText(/Sample preview only/i)).toBeInTheDocument();
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
