import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/app/routeTree.gen';

// Routable navigation, exercised in vitest with createMemoryHistory.
// These tests live in vitest (not Playwright) because nothing here
// requires real browser layout — we're testing route loaders, the
// router's match resolution, and the components rendering against a
// known URL. Real-browser parity for the same flows is held by the
// Playwright @smoke tier in e2e/, which catches the bug class jsdom
// can't reach (the createServerFn / hydration regression).

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultPendingMs: 0,
  });
  return { ...render(<RouterProvider router={router} />), router };
}

describe('Routable navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dk', 'lt');
  });

  it('renders the foyer at /', async () => {
    renderAt('/');
    expect(await screen.findByText('The door is open.')).toBeInTheDocument();
    expect(screen.getByText('The rooms are waiting.')).toBeInTheDocument();
  });

  it.each([
    { path: '/studio', heading: 'The Studio' },
    { path: '/garden', heading: 'The Garden' },
    { path: '/study', heading: 'The Study' },
    { path: '/salon', heading: 'The Salon' },
  ])('renders the room landing at $path with the $heading heading', async ({ path, heading }) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('navigates from the foyer to The Studio when the nav link is clicked', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/');
    await screen.findByText('The door is open.');

    await user.click(screen.getByRole('link', { name: 'Studio' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/studio');
    });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'The Studio' }),
    ).toBeInTheDocument();
  });

  it('opens a Salon work and walks back to the room landing', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/salon');
    await screen.findByRole('heading', { level: 1, name: 'The Salon' });

    // Click into a work whose existence is part of the Salon's preview
    // content. If preview content shifts, this needs to follow.
    await user.click(screen.getByRole('link', { name: /Arvo Pärt and the room between notes/i }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/salon/arvo-part-and-the-room-between-notes');
    });
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Arvo Pärt and the room between notes/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /← The Salon/i }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/salon');
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'The Salon' })).toBeInTheDocument();
  });
});
