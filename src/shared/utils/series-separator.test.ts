import { describe, it, expect } from 'vitest';
import { seriesSeparator } from './series-separator';

describe('seriesSeparator', () => {
  it('returns nothing before the only item in a 1-item series', () => {
    expect(seriesSeparator(0, 1)).toBe('');
  });

  it('joins two items with bare " and " (no Oxford comma needed)', () => {
    const items = ['apple', 'pear'];
    const joined = items.map((s, i) => seriesSeparator(i, items.length) + s).join('');
    expect(joined).toBe('apple and pear');
  });

  it('joins three items with the Oxford comma', () => {
    const items = ['apple', 'pear', 'quince'];
    const joined = items.map((s, i) => seriesSeparator(i, items.length) + s).join('');
    expect(joined).toBe('apple, pear, and quince');
  });

  it('joins four items with the Oxford comma before the final item', () => {
    const items = ['a', 'b', 'c', 'd'];
    const joined = items.map((s, i) => seriesSeparator(i, items.length) + s).join('');
    expect(joined).toBe('a, b, c, and d');
  });
});
