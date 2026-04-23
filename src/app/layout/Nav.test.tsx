import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { axe } from '@/test/axe';
import { ThemeProvider } from '@/app/providers';
import { Nav } from './Nav';

function renderNavAt(path = '/') {
  const rootRoute = createRootRoute({
    component: () => (
      <ThemeProvider>
        <Nav />
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('Nav', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dk', 'lt');
  });

  it('renders as a <nav> landmark', async () => {
    const { container } = renderNavAt();
    await screen.findByRole('link', { name: /Danny Dyer/ });
    expect(container.querySelector('nav')).not.toBeNull();
  });

  it('renders the wordmark linking to /', async () => {
    renderNavAt();
    const wordmark = await screen.findByRole('link', { name: /Danny Dyer/ });
    expect(wordmark).toHaveAttribute('href', '/');
  });

  it('renders the four room links in order', async () => {
    renderNavAt();
    await screen.findByRole('link', { name: /Danny Dyer/ });
    const studio = screen.getByRole('link', { name: 'Studio' });
    const garden = screen.getByRole('link', { name: 'Garden' });
    const study = screen.getByRole('link', { name: 'Study' });
    const salon = screen.getByRole('link', { name: 'Salon' });

    expect(studio).toHaveAttribute('href', '/studio');
    expect(garden).toHaveAttribute('href', '/garden');
    expect(study).toHaveAttribute('href', '/study');
    expect(salon).toHaveAttribute('href', '/salon');
  });

  it('does not render a Foyer link (wordmark is home)', async () => {
    renderNavAt();
    await screen.findByRole('link', { name: /Danny Dyer/ });
    expect(screen.queryByRole('link', { name: 'Foyer' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull();
  });

  it('includes the theme toggle', async () => {
    renderNavAt();
    await screen.findByRole('link', { name: /Danny Dyer/ });
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAccessibleName(/Switch to /);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderNavAt();
    await screen.findByRole('link', { name: /Danny Dyer/ });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
