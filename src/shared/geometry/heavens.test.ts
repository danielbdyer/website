import { describe, expect, test } from 'vitest';
import { HEAVENS_PERIOD_MS, heavensPhase } from './heavens';

describe('heavensPhase', () => {
  test('one full period returns the sky to the same phase', () => {
    expect(heavensPhase(0)).toBeCloseTo(0, 12);
    expect(heavensPhase(HEAVENS_PERIOD_MS)).toBeCloseTo(0, 12);
    expect(heavensPhase(HEAVENS_PERIOD_MS * 7)).toBeCloseTo(0, 12);
  });

  test('a quarter period is a quarter turn', () => {
    expect(heavensPhase(HEAVENS_PERIOD_MS / 4)).toBeCloseTo(Math.PI / 2, 12);
  });

  test('advances by 0.6° per second', () => {
    const perSecond = heavensPhase(1000) - heavensPhase(0);
    expect((perSecond * 180) / Math.PI).toBeCloseTo(0.6, 9);
  });

  test('stays in [0, 2π) for any instant, including before the epoch', () => {
    for (const t of [-1, -HEAVENS_PERIOD_MS - 5, 12_345_678_901, Date.now()]) {
      const phase = heavensPhase(t);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(Math.PI * 2);
    }
  });
});
