import { afterEach, describe, expect, test } from 'vitest';
import {
  getConstellationCursor,
  resetConstellationCursor,
  setConstellationCursor,
} from './constellationCursor';

afterEach(() => {
  resetConstellationCursor();
});

describe('constellation cursor signal', () => {
  test('starts at the origin, inactive', () => {
    expect(getConstellationCursor()).toEqual({ x: 0, y: 0, active: false });
  });

  test('reflects the most recent set', () => {
    setConstellationCursor(0.3, -0.7, true);
    expect(getConstellationCursor()).toEqual({ x: 0.3, y: -0.7, active: true });
  });

  test('reset zeroes the position and clears active', () => {
    setConstellationCursor(0.5, 0.5, true);
    resetConstellationCursor();
    expect(getConstellationCursor()).toEqual({ x: 0, y: 0, active: false });
  });
});
