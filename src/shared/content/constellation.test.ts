import { describe, expect, test } from 'vitest';
import { diskToHemisphere } from '@/shared/geometry/sphere';
import {
  COMPASS,
  FACET_AZIMUTH_DEG,
  getConstellationGraphSync,
  placeWork,
  spreadPlacements,
} from './constellation';

describe('getConstellationGraphSync — shape', () => {
  test('returns nodes, edges, and the facet→hue map', () => {
    const g = getConstellationGraphSync();
    expect(Array.isArray(g.nodes)).toBe(true);
    expect(Array.isArray(g.edges)).toBe(true);
    expect(g.facetHues).toMatchObject({
      craft: expect.any(String),
      consciousness: expect.any(String),
      language: expect.any(String),
      leadership: expect.any(String),
      beauty: expect.any(String),
      becoming: expect.any(String),
      relation: expect.any(String),
      body: expect.any(String),
    });
  });

  test('the Foyer is never represented as a star', () => {
    const g = getConstellationGraphSync();
    for (const node of g.nodes) {
      // Type-level: node.room is Exclude<Room, 'foyer'>. Runtime check
      // catches a future regression where a Foyer work might leak in.
      expect(node.room).not.toBe('foyer');
    }
  });
});

describe('getConstellationGraphSync — content', () => {
  test('includes the authored Garden work (small-weather)', () => {
    const g = getConstellationGraphSync();
    const smallWeather = g.nodes.find((n) => n.slug === 'small-weather');
    expect(smallWeather).toBeDefined();
    expect(smallWeather?.room).toBe('garden');
    expect(smallWeather?.facets).toEqual(
      expect.arrayContaining(['relation', 'body', 'becoming', 'language']),
    );
  });

  test('every node carries valid polar coordinates within the populated dome', () => {
    const g = getConstellationGraphSync();
    for (const node of g.nodes) {
      expect(node.angleDeg).toBeGreaterThanOrEqual(0);
      expect(node.angleDeg).toBeLessThan(360);
      // The compass placement keeps the polestar's center clear and the
      // stars inside the resting camera's view (RADIUS_MIN / RADIUS_MAX
      // in constellation.ts; radius × 90° = degrees from the pole).
      expect(node.radius).toBeGreaterThanOrEqual(0.18);
      expect(node.radius).toBeLessThanOrEqual(0.78);
    }
  });

  test('positioning is stable across calls', () => {
    const a = getConstellationGraphSync();
    const b = getConstellationGraphSync();
    expect(a.nodes.length).toBe(b.nodes.length);
    for (let i = 0; i < a.nodes.length; i++) {
      expect(a.nodes[i]?.angleDeg).toBe(b.nodes[i]?.angleDeg);
      expect(a.nodes[i]?.radius).toBe(b.nodes[i]?.radius);
    }
  });

  test('every edge connects two nodes that exist in the graph', () => {
    const g = getConstellationGraphSync();
    const keys = new Set(g.nodes.map((n) => `${n.room}/${n.slug}`));
    for (const edge of g.edges) {
      expect(keys.has(`${edge.source.room}/${edge.source.slug}`)).toBe(true);
      expect(keys.has(`${edge.target.room}/${edge.target.slug}`)).toBe(true);
    }
  });

  test('every edge carries the hue assigned to its facet', () => {
    const g = getConstellationGraphSync();
    for (const edge of g.edges) {
      expect(edge.hue).toBe(g.facetHues[edge.facet]);
    }
  });

  test('no edge connects a work to itself', () => {
    const g = getConstellationGraphSync();
    for (const edge of g.edges) {
      expect(`${edge.source.room}/${edge.source.slug}`).not.toBe(
        `${edge.target.room}/${edge.target.slug}`,
      );
    }
  });

  // Figures: each facet's strokes form a spanning tree over its
  // members — members − 1 strokes, every stroke joining two members —
  // in place of the complete co-membership graph. CONSTELLATION_WALK.md
  // §"What the Sky Draws at Rest".
  test("each facet's edges form a tree over exactly its members", () => {
    const g = getConstellationGraphSync();
    const key = (n: { room: string; slug: string }) => `${n.room}/${n.slug}`;
    for (const facet of COMPASS) {
      const members = g.nodes.filter((n) => n.facets.includes(facet)).map(key);
      const strokes = g.edges.filter((e) => e.facet === facet);
      expect(strokes.length).toBe(Math.max(members.length - 1, 0));
      for (const stroke of strokes) {
        expect(members).toContain(key(stroke.source));
        expect(members).toContain(key(stroke.target));
      }
      // Connected: walking the strokes from any member reaches all.
      if (members.length > 1) {
        const reached = new Set([members[0]!]);
        const grow = () => {
          for (const s of strokes) {
            if (reached.has(key(s.source))) reached.add(key(s.target));
            if (reached.has(key(s.target))) reached.add(key(s.source));
          }
        };
        members.forEach(() => grow());
        expect(reached.size).toBe(members.length);
      }
    }
  });

  test('the sky is far quieter than a co-membership mesh', () => {
    const g = getConstellationGraphSync();
    const mesh = COMPASS.reduce((sum, facet) => {
      const k = g.nodes.filter((n) => n.facets.includes(facet)).length;
      return sum + (k * (k - 1)) / 2;
    }, 0);
    expect(g.edges.length).toBeLessThan(mesh / 2);
  });

  // The latent-sphere invariants: every node's 3D unitPosition is
  // a true unit vector, sits on the upper hemisphere (the disk
  // projects there only), and equals the projection of the node's
  // 2D (angleDeg, radius) — the disk and the sphere can never
  // disagree about where a work is.
  test('every node carries a unit-norm 3D position on the upper hemisphere', () => {
    const g = getConstellationGraphSync();
    for (const node of g.nodes) {
      const { x, y, z } = node.unitPosition;
      const norm = Math.hypot(x, y, z);
      expect(norm).toBeCloseTo(1, 9);
      expect(z).toBeGreaterThanOrEqual(-1e-9);
    }
  });

  test('unitPosition equals diskToHemisphere(radius, angleDeg)', () => {
    const g = getConstellationGraphSync();
    for (const node of g.nodes) {
      const projected = diskToHemisphere(node.radius, (node.angleDeg * Math.PI) / 180);
      expect(node.unitPosition.x).toBeCloseTo(projected.x, 9);
      expect(node.unitPosition.y).toBeCloseTo(projected.y, 9);
      expect(node.unitPosition.z).toBeCloseTo(projected.z, 9);
    }
  });
});

// The compass: placement is a sentence about the work's facets.
// CONSTELLATION_WALK.md §"The Compass".
describe('placeWork', () => {
  const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

  test('a single-facet work sits on its bearing, a jitter away', () => {
    const p = placeWork('a-work-of-beauty', ['beauty']);
    expect(angleDiff(p.angleDeg, FACET_AZIMUTH_DEG.beauty)).toBeLessThanOrEqual(9);
    expect(p.radius).toBeGreaterThan(0.55);
    expect(p.radius).toBeLessThan(0.7);
  });

  test('two adjacent facets pull a work between their bearings, a little inward', () => {
    const p = placeWork('craft-and-body', ['craft', 'body']);
    expect(angleDiff(p.angleDeg, 22.5)).toBeLessThanOrEqual(9);
    const single = placeWork('craft-and-body', ['craft']);
    expect(p.radius).toBeLessThan(single.radius);
  });

  test('facets that pull in every direction leave a work at the still center', () => {
    const p = placeWork('everything', ['craft', 'consciousness']);
    expect(p.radius).toBeLessThanOrEqual(0.2);
  });

  test('a facetless work rests near the pole with a hashed bearing', () => {
    const p = placeWork('facetless', []);
    expect(p.radius).toBeLessThanOrEqual(0.2);
    expect(p.angleDeg).toBeGreaterThanOrEqual(0);
    expect(p.angleDeg).toBeLessThan(360);
  });

  test('placement is deterministic and never moves with the rest of the corpus', () => {
    expect(placeWork('small-weather', ['relation', 'body'])).toEqual(
      placeWork('small-weather', ['relation', 'body']),
    );
  });

  test('the compass lists the eight facets in bearing order', () => {
    expect(COMPASS).toEqual([
      'craft',
      'body',
      'beauty',
      'language',
      'consciousness',
      'becoming',
      'leadership',
      'relation',
    ]);
  });
});

describe('spreadPlacements', () => {
  const disk = (p: { angleDeg: number; radius: number }) => ({
    x: p.radius * Math.cos((p.angleDeg * Math.PI) / 180),
    y: p.radius * Math.sin((p.angleDeg * Math.PI) / 180),
  });
  const gap = (a: { angleDeg: number; radius: number }, b: { angleDeg: number; radius: number }) =>
    Math.hypot(disk(a).x - disk(b).x, disk(a).y - disk(b).y);

  test('two works with identical facets no longer share a star', () => {
    const twins = [placeWork('one', ['craft', 'body']), placeWork('one', ['craft', 'body'])];
    expect(gap(twins[0]!, twins[1]!)).toBeLessThan(0.095);
    const [a, b] = spreadPlacements(twins);
    expect(gap(a!, b!)).toBeGreaterThanOrEqual(0.094);
  });

  test('leaves already-separated placements where they are', () => {
    const apart = [placeWork('east', ['craft']), placeWork('west', ['consciousness'])];
    const spread = spreadPlacements(apart);
    expect(spread[0]!.angleDeg).toBeCloseTo(apart[0]!.angleDeg, 6);
    expect(spread[1]!.radius).toBeCloseTo(apart[1]!.radius, 6);
  });

  test('the built sky keeps every pair of stars a label apart, and none inside the pole', () => {
    const g = getConstellationGraphSync();
    for (const a of g.nodes) {
      expect(a.radius).toBeGreaterThanOrEqual(0.18 - 1e-9);
      for (const b of g.nodes) {
        if (a === b) continue;
        expect(gap(a, b)).toBeGreaterThanOrEqual(0.094);
      }
    }
  });
});
