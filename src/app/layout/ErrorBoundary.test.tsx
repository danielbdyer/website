import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import * as React from 'react';
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
    expect(await screen.findByText('Something here caught and fell.')).toBeInTheDocument();
    expect(screen.getByText('The rest of the house is still here.')).toBeInTheDocument();
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
    await screen.findByText('Something here caught and fell.');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('resets when its key changes — a new key remounts a fresh boundary', async () => {
    // The bug this guards: __root.tsx wraps <Outlet /> with
    // <ErrorBoundary key={pathname}>. Without the key, a route that
    // throws once stays in the error state forever — every subsequent
    // navigation lands on the fallback. The key forces React to mount
    // a fresh boundary per route, which is exactly the recovery shape
    // we want.
    const handles: {
      setExploding?: (v: boolean) => void;
      setBoundaryKey?: (v: string) => void;
    } = {};
    function Stateful() {
      const [exploding, setExploding] = React.useState(true);
      const [k, setK] = React.useState('/a');
      React.useEffect(() => {
        handles.setExploding = setExploding;
        handles.setBoundaryKey = setK;
      }, []);
      return <ErrorBoundary key={k}>{exploding ? <Exploder /> : <p>fresh page</p>}</ErrorBoundary>;
    }

    const rootRoute = createRootRoute({ component: Stateful });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Something here caught and fell.')).toBeInTheDocument();

    // Same key, non-throwing children: the boundary stays in its error
    // state. (This is the regression behavior — without the key, the
    // boundary stays poisoned even when the children would render fine.)
    act(() => handles.setExploding!(false));
    expect(screen.queryByText('fresh page')).toBeNull();
    expect(screen.getByText('Something here caught and fell.')).toBeInTheDocument();

    // New key: React mounts a fresh boundary. Children render normally.
    act(() => handles.setBoundaryKey!('/b'));
    expect(screen.getByText('fresh page')).toBeInTheDocument();
    expect(screen.queryByText('Something here caught and fell.')).toBeNull();
  });
});
