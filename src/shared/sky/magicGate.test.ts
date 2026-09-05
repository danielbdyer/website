import { describe, expect, test } from 'vitest';
import { magicWanted } from './magicGate';

const calm = { reducedMotion: false, saveData: false, search: '' };

describe('magicWanted', () => {
  test('wanted when nothing asks it to stay away', () => {
    expect(magicWanted(calm)).toBe(true);
    expect(magicWanted({ ...calm, search: '?focus=garden/small-weather' })).toBe(true);
  });

  test('never under reduced motion or Save-Data', () => {
    expect(magicWanted({ ...calm, reducedMotion: true })).toBe(false);
    expect(magicWanted({ ...calm, saveData: true })).toBe(false);
  });

  test('the perf probe can switch it off', () => {
    expect(magicWanted({ ...calm, search: '?magic=off' })).toBe(false);
    expect(magicWanted({ ...calm, search: '?atmosphere=off&magic=off' })).toBe(false);
    expect(magicWanted({ ...calm, search: '?magic=on' })).toBe(true);
  });
});
