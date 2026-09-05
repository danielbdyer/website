import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { CROWN_TURN_SECONDS, crownPhaseDelay, useCrownPhase } from './useCrownPhase';

describe('useCrownPhase — every crown on one clock', () => {
  test('the delay is the wall clock’s phase within one turn, negative so the crown is already there', () => {
    expect(crownPhaseDelay(0)).toBe('-0.000s');
    expect(crownPhaseDelay(12_345)).toBe('-12.345s');
    expect(crownPhaseDelay(CROWN_TURN_SECONDS * 1000 + 500)).toBe('-0.500s');
  });

  test('on mount every crown under the root takes the phase as its animation delay', () => {
    const root = document.createElement('div');
    const crowns = [0, 1].map(() => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'daystar__rays');
      root.append(g);
      return g;
    });
    renderHook(() => useCrownPhase({ current: root }));
    for (const g of crowns) {
      expect(g.style.getPropertyValue('animation-delay')).toMatch(/^-\d+\.\d{3}s$/);
      const seconds = Number(g.style.getPropertyValue('animation-delay').slice(1, -1));
      expect(seconds).toBeLessThan(CROWN_TURN_SECONDS);
    }
    expect(crowns[0]!.style.animationDelay).toBe(crowns[1]!.style.animationDelay);
  });
});
