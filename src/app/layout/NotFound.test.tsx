import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { axe } from '@/test/axe';
import { NotFound } from './NotFound';

function renderInRouter() {
  const rootRoute = createRootRoute({ component: NotFound });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('NotFound', () => {
  it('renders placeholder-bracketed 404 copy', async () => {
    renderInRouter();
    expect(await screen.findByText("[This door doesn't open.]")).toBeInTheDocument();
    expect(screen.getByText('[The rest of the house is still here.]')).toBeInTheDocument();
  });

  it('offers a link home', async () => {
    renderInRouter();
    const link = await screen.findByRole('link', { name: /Back home/ });
    expect(link).toHaveAttribute('href', '/');
  });

  it('includes an ornament between the message and the link', async () => {
    const { container } = renderInRouter();
    await screen.findByText("[This door doesn't open.]");
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderInRouter();
    await screen.findByText("[This door doesn't open.]");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
