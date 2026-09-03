import { describe, expect, test } from 'vitest';
import { rubberBand } from './elastic';

describe('rubberBand', () => {
  test('no pull, no give', () => {
    expect(rubberBand(0, 70)).toBe(0);
    expect(rubberBand(-5, 70)).toBe(0);
  });

  test('gives almost one-to-one at first, at the slope asked for', () => {
    expect(rubberBand(1, 70, 0.55)).toBeCloseTo(0.55, 2);
  });

  test('gives less and less, and never past the limit', () => {
    const a = rubberBand(50, 70);
    const b = rubberBand(200, 70);
    const c = rubberBand(5000, 70);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(c).toBeLessThan(70);
    expect(rubberBand(100, 70) - a).toBeLessThan(a);
  });
});
