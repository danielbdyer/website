import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { axe } from '@/test/axe';
import { ErrorBoundary } from './ErrorBoundary';

function Exploder(): never {
  throw new Error('boom');
}

function renderInRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <>{children}</> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs caught errors to console.error; silence that noise in tests.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders children when no error is thrown', async () => {
    renderInRouter(
      <ErrorBoundary>
        <p>no problems</p>
      </ErrorBoundary>,
    );
    expect(await screen.findByText('no problems')).toBeInTheDocument();
  });

  it('renders the recovery surface when a child throws', async () => {
    renderInRouter(
      <ErrorBoundary>
        <Exploder />
      </ErrorBoundary>,
    );
    expect(await screen.findByText('[Something here caught and fell.]')).toBeInTheDocument();
    expect(screen.getByText('[The rest of the house is still here.]')).toBeInTheDocument();
  });

  it('offers a link home in the recovery surface', async () => {
    renderInRouter(
      <ErrorBoundary>
        <Exploder />
      </ErrorBoundary>,
    );
    const link = await screen.findByRole('link', { name: /Back home/ });
    expect(link).toHaveAttribute('href', '/');
  });

  it('has no accessibility violations in the recovery state', async () => {
    const { container } = renderInRouter(
      <ErrorBoundary>
        <Exploder />
      </ErrorBoundary>,
    );
    await screen.findByText('[Something here caught and fell.]');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
