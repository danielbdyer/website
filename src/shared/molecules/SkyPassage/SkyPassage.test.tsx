import type { ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PASSAGE, PASSAGE_DWELL_MS } from '@/shared/content/passage';
import { SkyPassage } from './SkyPassage';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe('SkyPassage molecule', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('says nothing until the visitor has stood at the star a while', () => {
    render(<SkyPassage passage={PASSAGE} here={PASSAGE.from} traveling={false} />);
    expect(screen.queryByText('off the chart')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(PASSAGE_DWELL_MS);
    });
    expect(screen.getByText('off the chart')).toBeInTheDocument();
    const door = screen.getByRole('link', { name: /travel to objects of scale/i });
    expect(door).toHaveAttribute('href', '/scale');
  });

  test('a sky under way does not count as standing', () => {
    render(<SkyPassage passage={PASSAGE} here={PASSAGE.from} traveling />);
    act(() => {
      vi.advanceTimersByTime(PASSAGE_DWELL_MS * 2);
    });
    expect(screen.queryByText('off the chart')).not.toBeInTheDocument();
  });

  test('a star without a passage keeps quiet however long you stand', () => {
    render(<SkyPassage passage={null} here="pole" traveling={false} />);
    act(() => {
      vi.advanceTimersByTime(PASSAGE_DWELL_MS * 2);
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
