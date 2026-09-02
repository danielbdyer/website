import { describe, expect, test } from 'vitest';
import { diskToHemisphere } from '@/shared/geometry/sphere';
import type { ConstellationGraph, ConstellationNode } from './constellation';
import {
  COMPASS_RIM,
  COMPASS_RIM_THETA,
  POLE_KEY,
  REST_DISTANCE,
  bearingsOf,
  namedFrom,
  neighborToward,
  neighborsOf,
  restDistanceFor,
} from './skyWalk';

const FACET_HUES = {
  craft: 'warm',
  body: 'warm',
  beauty: 'rose',
  language: 'rose',
  consciousness: 'violet',
  becoming: 'violet',
  leadership: 'gold',
  relation: 'gold',
} as const;

function star(
  room: ConstellationNode['room'],
  slug: string,
  facets: ConstellationNode['facets'],
  angleDeg: number,
  radius: number,
): ConstellationNode {
  return {
    room,
    slug,
    title: slug,
    date: new Date('2026-01-01'),
    facets,
    posture: undefined,
    isPreview: false,
    angleDeg,
    radius,
    unitPosition: diskToHemisphere(radius, (angleDeg * Math.PI) / 180),
    hue: FACET_HUES[facets[0] ?? 'relation'],
    twinklePhase: 0,
  };
}

// A small sky: three stars of beauty in a line east of the pole, one
// star of craft to the north, one lonely star of body.
const beautyNear = star('garden', 'near', ['beauty'], 90, 0.2);
const beautyMid = star('garden', 'mid', ['beauty', 'craft'], 90, 0.4);
const beautyFar = star('salon', 'far', ['beauty'], 90, 0.6);
const craftNorth = star('studio', 'north', ['craft'], 0, 0.4);
const bodyAlone = star('study', 'alone', ['body'], 45, 0.5);

const GRAPH: ConstellationGraph = {
  facetHues: FACET_HUES,
  nodes: [beautyNear, beautyMid, beautyFar, craftNorth, bodyAlone],
  edges: [
    {
      facet: 'beauty',
      hue: 'rose',
      source: { room: 'garden', slug: 'mid' },
      target: { room: 'garden', slug: 'near' },
    },
    {
      facet: 'beauty',
      hue: 'rose',
      source: { room: 'garden', slug: 'mid' },
      target: { room: 'salon', slug: 'far' },
    },
    {
      facet: 'craft',
      hue: 'warm',
      source: { room: 'garden', slug: 'mid' },
      target: { room: 'studio', slug: 'north' },
    },
  ],
};

describe('neighborsOf', () => {
  test('lists the stars one stroke away, with the facet and edge that join them', () => {
    const near = neighborsOf(GRAPH, 'garden/mid');
    expect(near.map((n) => n.key).toSorted()).toEqual(['garden/near', 'salon/far', 'studio/north']);
    expect(near.find((n) => n.key === 'studio/north')?.facet).toBe('craft');
    expect(near.find((n) => n.key === 'garden/near')?.edgeId).toBe('garden/mid|garden/near|beauty');
  });

  test('a leaf star has one neighbor; the pole has none', () => {
    expect(neighborsOf(GRAPH, 'salon/far').map((n) => n.key)).toEqual(['garden/mid']);
    expect(neighborsOf(GRAPH, POLE_KEY)).toEqual([]);
  });
});

describe('bearingsOf', () => {
  test('a bearing from a star names the thread it travels along; the pole has none', () => {
    const neighbors = neighborsOf(GRAPH, 'garden/mid');
    for (const b of bearingsOf(GRAPH, 'garden/mid')) {
      if (!b.to) continue;
      expect(b.edgeId).toBe(neighbors.find((n) => n.key === b.to && n.facet === b.facet)?.edgeId);
      expect(b.edgeId).toContain(b.facet);
    }
    for (const b of bearingsOf(GRAPH, POLE_KEY)) expect(b.edgeId).toBeNull();
  });

  test("at a star, the bearings are its own facets in compass order, each leading along that facet's figure", () => {
    const bearings = bearingsOf(GRAPH, 'garden/mid');
    expect(bearings.map((b) => b.facet)).toEqual(['craft', 'beauty']);
    expect(bearings.find((b) => b.facet === 'craft')?.to).toBe('studio/north');
    // Two beauty neighbors; the nearer one is the bearing's destination.
    expect(bearings.find((b) => b.facet === 'beauty')?.to).toBe('garden/near');
  });

  test('a bearing with no other member yet leads nowhere', () => {
    const [body] = bearingsOf(GRAPH, 'study/alone');
    expect(body?.facet).toBe('body');
    expect(body?.to).toBeNull();
  });

  test('at the pole, all eight bearings are offered and lead to the nearest star that carries each', () => {
    const bearings = bearingsOf(GRAPH, POLE_KEY);
    expect(bearings.map((b) => b.facet)).toEqual([
      'craft',
      'body',
      'beauty',
      'language',
      'consciousness',
      'becoming',
      'leadership',
      'relation',
    ]);
    expect(bearings.find((b) => b.facet === 'beauty')?.to).toBe('garden/near');
    expect(bearings.find((b) => b.facet === 'craft')?.to).toBe('garden/mid');
    expect(bearings.find((b) => b.facet === 'relation')?.to).toBeNull();
    expect(bearings.find((b) => b.facet === 'beauty')?.hue).toBe('rose');
  });
});

describe('namedFrom', () => {
  test('names here, its neighbors, and where its bearings lead — nothing farther', () => {
    const named = namedFrom(GRAPH, 'salon/far');
    expect([...named].toSorted()).toEqual(['garden/mid', 'salon/far']);
  });

  test('at the pole, names the stars the bearings lead to', () => {
    const named = namedFrom(GRAPH, POLE_KEY);
    expect(named.has('garden/near')).toBe(true);
    expect(named.has('garden/mid')).toBe(true);
    expect(named.has('study/alone')).toBe(true);
    expect(named.has('salon/far')).toBe(false);
    expect(named.has(POLE_KEY)).toBe(false);
  });
});

describe('neighborToward', () => {
  test('picks the neighbor that lies along a screen direction', () => {
    // From mid, "north" (toward +x on the disk, angle 0) is craftNorth;
    // "outward along beauty" (+y) is far; "inward" (-y) is near.
    const towardX = neighborToward(GRAPH, 'garden/mid', { x: 1, y: 0, z: 0 });
    expect(towardX).toBe('studio/north');
    const outward = neighborToward(GRAPH, 'garden/mid', { x: 0, y: 1, z: 0 });
    expect(outward).toBe('salon/far');
    const inward = neighborToward(GRAPH, 'garden/mid', { x: 0, y: -1, z: 0 });
    expect(inward).toBe('garden/near');
  });

  test('returns null when nothing lies that way', () => {
    expect(neighborToward(GRAPH, 'salon/far', { x: 0, y: 1, z: 0 })).toBeNull();
  });
});

describe('restDistanceFor', () => {
  test('a landscape frame rests near REST_DISTANCE', () => {
    const d = restDistanceFor(1440, 900);
    expect(d).toBeGreaterThan(REST_DISTANCE - 0.05);
    expect(d).toBeLessThan(3.2);
  });

  test('a portrait phone stands farther back so no star is cropped', () => {
    const d = restDistanceFor(390, 844);
    expect(d).toBeGreaterThan(4);
    expect(d).toBeLessThanOrEqual(4.8);
  });

  test('a contained square frame and a degenerate frame fall back to the base', () => {
    expect(restDistanceFor(800, 800, 'contain')).toBeCloseTo(REST_DISTANCE, 5);
    expect(restDistanceFor(0, 0)).toBe(REST_DISTANCE);
  });
});

describe('COMPASS_RIM', () => {
  test('letters every facet on its bearing, just outside the populated cap', () => {
    const azimuths: Record<string, number> = {
      craft: 0,
      body: 45,
      beauty: 90,
      language: 135,
      consciousness: 180,
      becoming: 225,
      leadership: 270,
      relation: 315,
    };
    for (const [facet, p] of Object.entries(COMPASS_RIM)) {
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1, 9);
      expect(p.z).toBeCloseTo(Math.cos(COMPASS_RIM_THETA), 9);
      const az = ((Math.atan2(p.y, p.x) * 180) / Math.PI + 360) % 360;
      expect(az).toBeCloseTo(azimuths[facet]!, 6);
    }
  });
});
