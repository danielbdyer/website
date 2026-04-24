import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/app/providers';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dk', 'lt');
  });

  function renderToggle() {
    return render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
  }

  it('announces the next state via aria-label (light → dark)', () => {
    renderToggle();
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark mode');
  });

  it('toggles theme on click and updates aria-label', async () => {
    const user = userEvent.setup();
    renderToggle();
    const button = screen.getByRole('button');

    await user.click(button);

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dk')).toBe(true);
    expect(button).toHaveAccessibleName('Switch to light mode');
  });

  it('toggles back on second click', async () => {
    const user = userEvent.setup();
    renderToggle();
    const button = screen.getByRole('button');

    await user.click(button);
    await user.click(button);

    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('lt')).toBe(true);
    expect(button).toHaveAccessibleName('Switch to dark mode');
  });

  it('responds to keyboard activation', async () => {
    const user = userEvent.setup();
    renderToggle();
    const button = screen.getByRole('button');

    button.focus();
    await user.keyboard('{Enter}');

    expect(document.documentElement.classList.contains('dk')).toBe(true);
  });
});
