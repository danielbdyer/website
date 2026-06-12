import { describe, expect, test } from 'vitest';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { diskToHemisphere } from '@/shared/geometry/sphere';
import { activeStarIndex, buildAtmosphericScene } from './atmosphereScene';

const GRAPH: ConstellationGraph = {
  facetHues: {
    craft: 'warm',
    body: 'warm',
    beauty: 'rose',
    language: 'rose',
    consciousness: 'violet',
    becoming: 'violet',
    leadership: 'gold',
    relation: 'gold',
  },
  nodes: [
    {
      room: 'garden',
      slug: 'small-weather',
      title: 'small weather',
      date: new Date('2026-04-24'),
      facets: ['relation'],
      posture: undefined,
      isPreview: false,
      angleDeg: 135,
      radius: 0.6,
      unitPosition: diskToHemisphere(0.6, (135 * Math.PI) / 180),
      hue: 'gold',
      twinklePhase: 1.2,
    },
    {
      room: 'studio',
      slug: 'second',
      title: 'second',
      date: new Date('2026-05-01'),
      facets: ['craft'],
      posture: undefined,
      isPreview: false,
      angleDeg: 225,
      radius: 0.7,
      unitPosition: diskToHemisphere(0.7, (225 * Math.PI) / 180),
      hue: 'warm',
      twinklePhase: 0.4,
    },
  ],
  edges: [],
};

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
