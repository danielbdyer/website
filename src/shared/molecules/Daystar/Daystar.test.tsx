import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { axe } from '@/test/axe';
import { Daystar } from './Daystar';

describe('Daystar molecule', () => {
  test('given the hour it is a real button that names the turn it makes', async () => {
    const user = userEvent.setup();
    const turn = vi.fn();
    render(<Daystar hour={{ current: 'day', turn }} />);
    const button = screen.getByRole('button', { name: /turn the hour to night/i });
    expect(button.dataset.daystar).toBe('true');
    expect(button.dataset.hour).toBe('day');
    await user.click(button);
    expect(turn).toHaveBeenCalledTimes(1);
  });

  test('by night the label offers the day', () => {
    render(<Daystar hour={{ current: 'night', turn: () => {} }} />);
    expect(screen.getByRole('button', { name: /turn the hour to day/i })).toBeInTheDocument();
  });

  test('without an hour it is decorative: no button, hidden from assistive output', () => {
    const { container } = render(<Daystar />);
    expect(screen.queryByRole('button')).toBeNull();
    const figure = container.querySelector('[data-daystar]');
    expect(figure?.tagName).toBe('DIV');
    expect(figure?.getAttribute('aria-hidden')).toBe('true');
  });

  test('both faces are always in the DOM — CSS chooses the hour, so there is no flash', () => {
    const { container } = render(<Daystar hour={{ current: 'day', turn: () => {} }} />);
    expect(container.querySelector('.daystar__sun')).not.toBeNull();
    expect(container.querySelector('.daystar__moon')).not.toBeNull();
  });

  test('the magic mounts fresh on every turn and only then', async () => {
    const user = userEvent.setup();
    const { container } = render(<Daystar hour={{ current: 'day', turn: () => {} }} />);
    expect(container.querySelector('.daystar__magic')).toBeNull();
    await user.click(screen.getByRole('button'));
    const first = container.querySelector('.daystar__magic');
    expect(first).not.toBeNull();
    expect(container.querySelectorAll('.daystar__spark')).toHaveLength(8);
    await user.click(screen.getByRole('button'));
    const second = container.querySelector('.daystar__magic');
    expect(second).not.toBeNull();
    // A new element each time, so its animations play again.
    expect(second).not.toBe(first);
    expect(container.querySelectorAll('.daystar__magic')).toHaveLength(1);
  });

  test('carries the daystar view-transition name, so the nav’s glyph can become it', () => {
    const { container } = render(<Daystar hour={{ current: 'day', turn: () => {} }} />);
    const button = container.querySelector<HTMLElement>('[data-daystar]');
    expect(button?.style.viewTransitionName).toBe('daystar');
  });

  test('has no axe-detectable violations', async () => {
    const { container } = render(<Daystar hour={{ current: 'night', turn: () => {} }} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
