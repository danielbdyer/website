import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { axe } from '@/test/axe';
import { FacetChip } from './FacetChip';

function renderChip(facet: 'craft' | 'language') {
  const rootRoute = createRootRoute({ component: () => <FacetChip facet={facet} /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('FacetChip', () => {
  it('renders the lowercase facet name', async () => {
    renderChip('craft');
    expect(await screen.findByText('craft')).toBeInTheDocument();
  });

  it('renders a link to the facet page', async () => {
    renderChip('language');
    const link = await screen.findByRole('link', { name: 'language' });
    expect(link).toHaveAttribute('href', '/facet/language');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderChip('craft');
    await screen.findByText('craft');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
