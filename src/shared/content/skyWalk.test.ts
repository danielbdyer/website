import { describe, expect, test } from 'vitest';
import { FACET_AXES, figure, relation, sky, star } from '@/test/sky-graph';
import {
  COMPASS_RIM_THETA,
  POLE_KEY,
  REST_DISTANCE,
  bearingsOf,
  namedFrom,
  namedRanks,
  namesAt,
  neighborToward,
  neighborsOf,
  restDistanceFor,
} from './skyWalk';

// A small sky: three stars of beauty in a line east of the pole, one
// star of craft to the north, one lonely star of body.
const beautyNear = star('garden/near', ['beauty'], 90, 0.2);
const beautyMid = star('garden/mid', ['beauty', 'craft'], 90, 0.4);
const beautyFar = star('salon/far', ['beauty'], 90, 0.6);
const craftNorth = star('studio/north', ['craft'], 0, 0.4);
const bodyAlone = star('study/alone', ['body'], 45, 0.5);

const GRAPH = sky(
  [beautyNear, beautyMid, beautyFar, craftNorth, bodyAlone],
  [
    figure('garden/mid', 'garden/near', 'beauty'),
    figure('garden/mid', 'salon/far', 'beauty'),
    figure('garden/mid', 'studio/north', 'craft'),
  ],
);

describe('neighborsOf', () => {
  test('lists the stars one stroke away, with the axis and edge that join them', () => {
    const near = neighborsOf(GRAPH, 'garden/mid');
    expect(near.map((n) => n.key).toSorted()).toEqual(['garden/near', 'salon/far', 'studio/north']);
    expect(near.find((n) => n.key === 'studio/north')?.axis).toBe('craft');
    expect(near.find((n) => n.key === 'garden/near')?.edgeId).toBe('garden/mid|garden/near|beauty');
  });

  test('a leaf star has one neighbor; the pole has none', () => {
    expect(neighborsOf(GRAPH, 'salon/far').map((n) => n.key)).toEqual(['garden/mid']);
    expect(neighborsOf(GRAPH, POLE_KEY)).toEqual([]);
  });

  test('a relation the slice carried is a neighbor too, with no axis', () => {
    const linked = sky(GRAPH.nodes, [
      ...GRAPH.edges,
      relation('study/alone', 'salon/far', 'references'),
    ]);
    const alone = neighborsOf(linked, 'study/alone');
    expect(alone).toEqual([
      { key: 'salon/far', axis: null, edgeId: 'study/alone|salon/far|references' },
    ]);
    // A relation is a thread to walk, not a bearing of the compass.
    expect(bearingsOf(linked, 'study/alone').map((b) => b.axis)).toEqual(['body']);
  });
});

describe('bearingsOf', () => {
  test('a bearing from a star names the thread it travels along; the pole has none', () => {
    const neighbors = neighborsOf(GRAPH, 'garden/mid');
    for (const b of bearingsOf(GRAPH, 'garden/mid')) {
      if (!b.to) continue;
      expect(b.edgeId).toBe(neighbors.find((n) => n.key === b.to && n.axis === b.axis)?.edgeId);
      expect(b.edgeId).toContain(b.axis);
    }
    for (const b of bearingsOf(GRAPH, POLE_KEY)) expect(b.edgeId).toBeNull();
  });

  test("at a star, the bearings are its own axes in compass order, each leading along that axis's figure", () => {
    const bearings = bearingsOf(GRAPH, 'garden/mid');
    expect(bearings.map((b) => b.axis)).toEqual(['craft', 'beauty']);
    expect(bearings.map((b) => b.name)).toEqual(['craft', 'beauty']);
    expect(bearings.find((b) => b.axis === 'craft')?.to).toBe('studio/north');
    // Two beauty neighbors; the nearer one is the bearing's destination.
    expect(bearings.find((b) => b.axis === 'beauty')?.to).toBe('garden/near');
  });

  test('a bearing with no other member yet leads nowhere', () => {
    const [body] = bearingsOf(GRAPH, 'study/alone');
    expect(body?.axis).toBe('body');
    expect(body?.to).toBeNull();
  });

  test('at the pole, every bearing is offered and leads to the nearest star that carries it', () => {
    const bearings = bearingsOf(GRAPH, POLE_KEY);
    expect(bearings.map((b) => b.axis)).toEqual([
      'craft',
      'body',
      'beauty',
      'language',
      'consciousness',
      'becoming',
      'leadership',
      'relation',
    ]);
    expect(bearings.find((b) => b.axis === 'beauty')?.to).toBe('garden/near');
    expect(bearings.find((b) => b.axis === 'craft')?.to).toBe('garden/mid');
    expect(bearings.find((b) => b.axis === 'relation')?.to).toBeNull();
    expect(bearings.find((b) => b.axis === 'beauty')?.hue).toBe('rose');
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
  test('a landscape frame rests near REST_DISTANCE, the oculus filling its height', () => {
    const d = restDistanceFor(1440, 900);
    expect(d).toBeGreaterThan(REST_DISTANCE - 0.1);
    expect(d).toBeLessThan(REST_DISTANCE + 0.1);
  });

  test('a portrait phone stands farther back so the oculus fits its width', () => {
    const d = restDistanceFor(390, 844);
    expect(d).toBeGreaterThan(4.9);
    expect(d).toBeLessThanOrEqual(5.6);
  });

  test('a contained square frame holds the nearest rest; a degenerate frame falls back', () => {
    expect(restDistanceFor(800, 800, 'contain')).toBeGreaterThanOrEqual(3.2);
    expect(restDistanceFor(0, 0)).toBe(REST_DISTANCE);
  });
});

describe('the compass rim', () => {
  test('letters every axis on its bearing, just outside the populated cap', () => {
    for (const axis of FACET_AXES) {
      const p = axis.rim;
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1, 9);
      expect(p.z).toBeCloseTo(Math.cos(COMPASS_RIM_THETA), 9);
      const az = ((Math.atan2(p.y, p.x) * 180) / Math.PI + 360) % 360;
      expect(az).toBeCloseTo(axis.azimuthDeg, 6);
    }
  });
});

describe('namesAt', () => {
  const crowd = sky(
    Array.from({ length: 258 }, (_, i) =>
      star(`c/${i}`, ['craft'], (i * 137.508) % 360, 0.18 + 0.6 * Math.sqrt(i / 258)),
    ),
    [],
  );

  test('a small sky names the ends of its bearings at the pole', () => {
    expect(namesAt(GRAPH, POLE_KEY)).toBe(true);
    expect(namedFrom(GRAPH, POLE_KEY).size).toBeGreaterThan(0);
  });

  test('a crowded sky names no star at the pole; the compass carries the labels', () => {
    expect(namesAt(crowd, POLE_KEY)).toBe(false);
    expect(namedFrom(crowd, POLE_KEY).size).toBe(0);
    expect(namedRanks(crowd, POLE_KEY).size).toBe(0);
  });

  test('standing at a star of a crowded sky, here and its neighborhood are named', () => {
    expect(namesAt(crowd, 'c/3')).toBe(true);
    expect(namedRanks(crowd, 'c/3').get('c/3')).toBe('here');
  });
});
