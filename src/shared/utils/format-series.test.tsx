import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { formatSeries } from './format-series';

function joined(items: readonly string[]): string {
  const { container } = render(<>{formatSeries(items, (s) => s)}</>);
  return container.textContent ?? '';
}

describe('formatSeries', () => {
  it('renders nothing for an empty series', () => {
    const { container } = render(<>{formatSeries([], (s) => s)}</>);
    expect(container.textContent).toBe('');
  });

  it('renders a single item without separator', () => {
    expect(joined(['apple'])).toBe('apple');
  });

  it('joins two items with bare " and "', () => {
    expect(joined(['apple', 'pear'])).toBe('apple and pear');
  });

  it('joins three items with the Oxford comma', () => {
    expect(joined(['apple', 'pear', 'quince'])).toBe('apple, pear, and quince');
  });

  it('joins four items with the Oxford comma before the final item', () => {
    expect(joined(['a', 'b', 'c', 'd'])).toBe('a, b, c, and d');
  });

  it('renders the items as React nodes via the render callback', () => {
    const { container } = render(
      <>
        {formatSeries(['one', 'two'], (s) => (
          <strong>{s}</strong>
        ))}
      </>,
    );
    expect(container.querySelectorAll('strong')).toHaveLength(2);
    expect(container.textContent).toBe('one and two');
  });
});
