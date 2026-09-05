import { describe, expect, test } from 'vitest';
import type { AtmosphericScene } from './atmosphereScene';
import { adoptAtmosphere, prepareAtmosphere, sceneKeyOf } from './warmAtmosphere';

const sceneOf = (keys: readonly string[]): AtmosphericScene => ({
  stars: keys.map((key) => ({
    key,
    unitPosition: { x: 0, y: 0, z: 1 },
    hueIndex: 0,
    twinklePhase: 0,
    sizeVariance: 1,
  })),
  motes: [],
});

const PALETTE = {
  zenith: [0, 0, 0] as const,
  horizon: [0, 0, 0] as const,
  ground: [0, 0, 0] as const,
  glow: [0, 0, 0] as const,
  glowStrength: 0,
  accents: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ] as const,
  grain: 0,
  ink: [0, 0, 0] as const,
  night: 0,
};

describe('prepared atmospheres — made ahead, adopted whole', () => {
  test('a scene is keyed by its stars, in order', () => {
    expect(sceneKeyOf(sceneOf(['a/b', 'c/d']))).toBe('a/b|c/d');
    expect(sceneKeyOf(sceneOf(['c/d', 'a/b']))).not.toBe(sceneKeyOf(sceneOf(['a/b', 'c/d'])));
  });

  test('preparing the same scene twice is one preparation; a new scene replaces it', async () => {
    const scene = sceneOf(['a/b']);
    const first = prepareAtmosphere(scene, PALETTE, 1);
    const again = prepareAtmosphere(sceneOf(['a/b']), PALETTE, 1);
    expect(again).toBe(first);
    const other = prepareAtmosphere(sceneOf(['x/y']), PALETTE, 1);
    expect(other).not.toBe(first);
    // Under happy-dom there is no WebGL: the preparation resolves to
    // nothing, honestly, rather than throwing.
    await expect(other).resolves.toBeNull();
  });

  test('an adoption takes the prepared atmosphere for its own scene, once, and nothing for another', async () => {
    const scene = sceneOf(['p/q']);
    const made = prepareAtmosphere(scene, PALETTE, 1);
    expect(adoptAtmosphere(sceneOf(['r/s']))).toBeNull();
    expect(adoptAtmosphere(sceneOf(['p/q']))).toBe(made);
    // Adopted, it is no longer held.
    expect(adoptAtmosphere(sceneOf(['p/q']))).toBeNull();
    await expect(made).resolves.toBeNull();
  });
});
