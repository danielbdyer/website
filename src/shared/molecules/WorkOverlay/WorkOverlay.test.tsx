import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { axe } from '@/test/axe';
import type { DisplayWork } from '@/shared/content';
import { WorkOverlay } from './WorkOverlay';

const SAMPLE_WORK: DisplayWork = {
  room: 'garden',
  slug: 'small-weather',
  title: 'small weather',
  date: new Date('2026-04-24'),
  facets: ['relation', 'language'],
  type: 'poem',
  feature: false,
  draft: false,
  body: 'listen — / i moved across the country',
  html: '<p>listen — i moved across the country</p>',
  backlinks: [],
};

function renderOverlay(work: DisplayWork) {
  // A miniature of the real tree — /sky parent with the overlay as
  // a child — so close navigations (Escape, backdrop, ×) have a
  // real destination to land on.
  const rootRoute = createRootRoute({ component: Outlet });
  const skyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sky',
    component: Outlet,
  });
  const overlayRoute = createRoute({
    getParentRoute: () => skyRoute,
    path: '$room/$slug',
    component: () => <WorkOverlay work={work} closeHref="/sky" />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([skyRoute.addChildren([overlayRoute])]),
    history: createMemoryHistory({ initialEntries: ['/sky/garden/small-weather'] }),
  });
  return { router, ...render(<RouterProvider router={router} />) };
}

describe('WorkOverlay molecule', () => {
  test('renders as a modal-shaped dialog with the work title as accessible name', async () => {
    renderOverlay(SAMPLE_WORK);
    const dialog = await screen.findByRole('dialog', { name: /small weather/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('renders the work content — title, date, body, facets', async () => {
    renderOverlay(SAMPLE_WORK);
    expect(await screen.findByRole('heading', { name: /small weather/i })).toBeInTheDocument();
    expect(screen.getByText(/april/i)).toBeInTheDocument();
    expect(screen.getByText(/i moved across the country/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^relation$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^language$/i })).toBeInTheDocument();
  });

  test('exposes a close affordance and a backdrop-close link to the parent sky', async () => {
    renderOverlay(SAMPLE_WORK);
    // Both the × button and the "Back into the sky" line link to the
    // parent. The backdrop is a third closing surface.
    const closes = await screen.findAllByRole('link', { name: /close|back into the sky/i });
    expect(closes.length).toBeGreaterThanOrEqual(2);
    for (const c of closes) {
      expect(c).toHaveAttribute('href', '/sky');
    }
  });

  test('has no axe-detectable violations', async () => {
    const { container } = renderOverlay(SAMPLE_WORK);
    await screen.findByRole('dialog');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Escape closes the overlay back into the sky — never past it', async () => {
    const user = userEvent.setup();
    const { router } = renderOverlay(SAMPLE_WORK);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(router.history.location.pathname).toBe('/sky');
    });
  });
});
