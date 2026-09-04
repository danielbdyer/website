import { describe, expect, test } from 'vitest';
import { sky, star } from '@/test/sky-graph';
import { activeStarIndex, buildAtmosphericScene } from './atmosphereScene';

const GRAPH = sky(
  [
    star('garden/small-weather', ['relation'], 135, 0.6, {
      title: 'small weather',
      date: new Date('2026-04-24'),
      twinklePhase: 1.2,
    }),
    star('studio/second', ['craft'], 225, 0.7, {
      title: 'second',
      date: new Date('2026-05-01'),
      twinklePhase: 0.4,
    }),
  ],
  [],
);

describe('buildAtmosphericScene', () => {
  test('maps every node to a star with its hue index and phase', () => {
    const scene = buildAtmosphericScene(GRAPH);
    expect(scene.stars).toHaveLength(2);
    expect(scene.stars[0]).toMatchObject({
      key: 'garden/small-weather',
      hueIndex: 3,
      twinklePhase: 1.2,
    });
    expect(scene.stars[1]!.hueIndex).toBe(0);
    expect(scene.stars[0]!.unitPosition).toEqual(GRAPH.nodes[0]!.unitPosition);
  });

  test('is deterministic — the same graph yields the same scene', () => {
    const a = buildAtmosphericScene(GRAPH);
    const b = buildAtmosphericScene(GRAPH);
    expect(a.stars).toEqual(b.stars);
    expect(a.motes).toEqual(b.motes);
  });

  test('returns the same scene object for the same graph — the remount guard', () => {
    // The scene is an effect dependency in the WebGL hook. A fresh
    // object per render would tear the GL context down on every
    // hover; identity is the contract that keeps the atmosphere
    // mounted across re-renders.
    expect(buildAtmosphericScene(GRAPH)).toBe(buildAtmosphericScene(GRAPH));
  });

  test('size variance stays inside its tuned band', () => {
    const scene = buildAtmosphericScene(GRAPH);
    for (const star of scene.stars) {
      expect(star.sizeVariance).toBeGreaterThanOrEqual(0.75);
      expect(star.sizeVariance).toBeLessThanOrEqual(1.25);
    }
  });

  test('motes drift on shells just above the sphere', () => {
    const scene = buildAtmosphericScene(GRAPH);
    expect(scene.motes.length).toBeGreaterThan(0);
    for (const mote of scene.motes) {
      const r = Math.hypot(mote.basePosition.x, mote.basePosition.y, mote.basePosition.z);
      expect(r).toBeGreaterThanOrEqual(1.03);
      expect(r).toBeLessThanOrEqual(1.31);
      // Drift directions are tangent to the radial direction.
      const dotA =
        (mote.driftA.x * mote.basePosition.x +
          mote.driftA.y * mote.basePosition.y +
          mote.driftA.z * mote.basePosition.z) /
        r;
      expect(Math.abs(dotA)).toBeLessThan(1e-6);
    }
  });
});

describe('activeStarIndex', () => {
  const scene = buildAtmosphericScene(GRAPH);

  test('resolves the structural active key to a sprite index', () => {
    expect(activeStarIndex(scene, 'studio/second')).toBe(1);
  });

  test('returns -1 for no claim or an unknown key', () => {
    expect(activeStarIndex(scene, null)).toBe(-1);
    expect(activeStarIndex(scene, 'salon/nope')).toBe(-1);
  });
});
