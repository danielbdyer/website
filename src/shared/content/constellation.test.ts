import { describe, expect, test } from 'vitest';
import { diskToHemisphere } from '@/shared/geometry/sphere';
import {
  axesOf,
  capFor,
  DEFAULT_CAP,
  edgeId,
  getConstellationGraphSync,
  graphFromSlice,
  placeNode,
  RADIUS_MAX,
  spreadPlacements,
} from './constellation';
import { COMPASS, FACET_AZIMUTH_DEG, FACET_HUE, facetAxes } from './facet-compass';

describe('getConstellationGraphSync — shape', () => {
  test('returns the eight facets as axes in bearing order, with their hues', () => {
    const g = getConstellationGraphSync();
    expect(Array.isArray(g.nodes)).toBe(true);
    expect(Array.isArray(g.edges)).toBe(true);
    expect(g.axes.map((a) => a.id)).toEqual([...COMPASS]);
    for (const axis of g.axes) {
      expect(axis.hue).toBe(FACET_HUE[axis.id as keyof typeof FACET_HUE]);
      expect(axis.azimuthDeg).toBe(FACET_AZIMUTH_DEG[axis.id as keyof typeof FACET_AZIMUTH_DEG]);
    }
  });

  test('the Foyer is never represented as a star', () => {
    const g = getConstellationGraphSync();
    for (const node of g.nodes) {
      // The works adapter cuts from the four sky rooms; a Foyer work
      // leaking in would be a regression here.
      expect(node.group).not.toBe('foyer');
    }
  });
});

describe('getConstellationGraphSync — content', () => {
  test('includes the authored Garden work (small-weather)', () => {
    const g = getConstellationGraphSync();
    const smallWeather = g.nodes.find((n) => n.key === 'garden/small-weather');
    expect(smallWeather).toBeDefined();
    expect(smallWeather?.group).toBe('garden');
    expect(smallWeather?.href).toBe('/sky/garden/small-weather');
    expect(smallWeather?.axes).toEqual(
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
    const keys = new Set(g.nodes.map((n) => n.key));
    for (const edge of g.edges) {
      expect(keys.has(edge.source)).toBe(true);
      expect(keys.has(edge.target)).toBe(true);
    }
  });

  test("every stroke of a figure carries its axis's hue; a relation carries none", () => {
    const g = getConstellationGraphSync();
    for (const edge of g.edges) {
      if (edge.axis === null) {
        expect(edge.hue).toBeNull();
        expect(edge.origin).not.toBe('emergent');
      } else {
        expect(edge.origin).toBe('emergent');
        expect(edge.hue).toBe(g.axes.find((a) => a.id === edge.axis)?.hue);
      }
    }
  });

  test('no edge connects a node to itself', () => {
    const g = getConstellationGraphSync();
    for (const edge of g.edges) {
      expect(edge.source).not.toBe(edge.target);
    }
  });

  // Figures: each axis's strokes form a spanning tree over its
  // members — members − 1 strokes, every stroke joining two members —
  // in place of the complete co-membership graph. CONSTELLATION_WALK.md
  // §"What the Sky Draws at Rest".
  test("each axis's strokes form a tree over exactly its members", () => {
    const g = getConstellationGraphSync();
    for (const axis of g.axes) {
      const members = g.nodes.filter((n) => n.axes.includes(axis.id)).map((n) => n.key);
      const strokes = g.edges.filter((e) => e.axis === axis.id);
      expect(strokes.length).toBe(Math.max(members.length - 1, 0));
      for (const stroke of strokes) {
        expect(members).toContain(stroke.source);
        expect(members).toContain(stroke.target);
      }
      // Connected: walking the strokes from any member reaches all.
      if (members.length > 1) {
        const reached = new Set([members[0]!]);
        const grow = () => {
          for (const s of strokes) {
            if (reached.has(s.source)) reached.add(s.target);
            if (reached.has(s.target)) reached.add(s.source);
          }
        };
        members.forEach(() => grow());
        expect(reached.size).toBe(members.length);
      }
    }
  });

  test('the sky is far quieter than a co-membership mesh', () => {
    const g = getConstellationGraphSync();
    const mesh = g.axes.reduce((sum, axis) => {
      const k = g.nodes.filter((n) => n.axes.includes(axis.id)).length;
      return sum + (k * (k - 1)) / 2;
    }, 0);
    expect(g.edges.filter((e) => e.axis !== null).length).toBeLessThan(mesh / 2);
  });

  // The latent-sphere invariants: every node's 3D unitPosition is
  // a true unit vector, sits on the upper hemisphere (the disk
  // projects there only), and equals the projection of the node's
  // 2D (angleDeg, radius) — the disk and the sphere can never
  // disagree about where a star is.
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

// The sky reads a slice: any axes, any keys, relations as threads.
describe('graphFromSlice', () => {
  const AT = '2026-09-03T00:00:00.000Z';
  const slice = {
    space: 'test',
    asOf: AT,
    axes: [
      { id: 'north', name: 'north', azimuthDeg: 0 },
      { id: 'south', name: 'south', azimuthDeg: 180 },
    ],
    nodes: [
      { id: 'a', title: 'A', kind: 'claim', axes: ['north'], createdAt: AT },
      { id: 'b', title: 'B', kind: 'claim', axes: ['north'], createdAt: AT, summary: 'about a' },
      { id: 'c', title: 'C', kind: 'moc', axes: ['south'], createdAt: AT },
    ],
    edges: [
      { subject: 'a', predicate: 'references' as const, object: 'c', origin: 'declared' as const },
    ],
    pending: { unresolved: 0, ghosts: [] },
  };

  test('places nodes by their axes and joins each axis into a figure', () => {
    const g = graphFromSlice(slice);
    expect(g.axes.map((a) => a.id)).toEqual(['north', 'south']);
    expect(g.nodes.map((n) => n.key)).toEqual(['a', 'b', 'c']);
    const north = g.edges.filter((e) => e.axis === 'north');
    expect(north).toHaveLength(1);
    expect(north[0]?.origin).toBe('emergent');
    expect(g.nodes.find((n) => n.key === 'c')?.href).toBeNull();
  });

  test('carries a declared relation as a thread without an axis, spoken by predicate', () => {
    const g = graphFromSlice(slice);
    const declared = g.edges.find((e) => e.origin === 'declared');
    expect(declared).toMatchObject({ source: 'a', target: 'c', axis: null, hue: null });
    expect(edgeId(declared!)).toBe('a|c|references');
  });

  test('assigns hues around the compass when the source names none', () => {
    const g = graphFromSlice(slice);
    expect(g.axes.map((a) => a.hue)).toEqual(['warm', 'violet']);
  });
});

describe('axesOf', () => {
  test('the eight facets keep their hues and dot the second of each pair', () => {
    const axes = axesOf(facetAxes());
    expect(axes.map((a) => a.id)).toEqual([...COMPASS]);
    expect(axes.map((a) => a.hue)).toEqual([
      'warm',
      'warm',
      'rose',
      'rose',
      'violet',
      'violet',
      'gold',
      'gold',
    ]);
    expect(axes.filter((a) => a.dotted).map((a) => a.id)).toEqual([
      'body',
      'language',
      'becoming',
      'relation',
    ]);
  });

  test('thirteen unnamed axes read as four arcs, the alternates dotted', () => {
    const axes = axesOf(
      Array.from({ length: 13 }, (_, i) => ({
        id: `m${i}`,
        name: `map ${i}`,
        azimuthDeg: (i * 360) / 13,
      })),
    );
    const arcs = axes.map((a) => a.hue);
    expect(arcs.filter((h) => h === 'warm')).toHaveLength(4);
    expect(arcs.filter((h) => h === 'rose')).toHaveLength(3);
    expect(arcs.filter((h) => h === 'violet')).toHaveLength(3);
    expect(arcs.filter((h) => h === 'gold')).toHaveLength(3);
    expect(axes.slice(0, 4).map((a) => a.dotted)).toEqual([false, true, false, true]);
    for (const axis of axes)
      expect(Math.hypot(axis.rim.x, axis.rim.y, axis.rim.z)).toBeCloseTo(1, 9);
  });
});

// The compass: placement is a sentence about the node's axes.
// CONSTELLATION_WALK.md §"The Compass".
describe('placeNode', () => {
  const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

  test('a node on one axis sits on its bearing, a jitter away', () => {
    const p = placeNode('a-work-of-beauty', [FACET_AZIMUTH_DEG.beauty]);
    expect(angleDiff(p.angleDeg, FACET_AZIMUTH_DEG.beauty)).toBeLessThanOrEqual(9);
    expect(p.radius).toBeGreaterThan(0.55);
    expect(p.radius).toBeLessThan(0.7);
  });

  test('two adjacent axes pull a node between their bearings, a little inward', () => {
    const p = placeNode('craft-and-body', [0, 45]);
    expect(angleDiff(p.angleDeg, 22.5)).toBeLessThanOrEqual(9);
    const single = placeNode('craft-and-body', [0]);
    expect(p.radius).toBeLessThan(single.radius);
  });

  test('axes that pull in every direction leave a node at the still center', () => {
    const p = placeNode('everything', [0, 180]);
    expect(p.radius).toBeLessThanOrEqual(0.2);
  });

  test('a node with no axes rests near the pole with a hashed bearing', () => {
    const p = placeNode('unplaced', []);
    expect(p.radius).toBeLessThanOrEqual(0.2);
    expect(p.angleDeg).toBeGreaterThanOrEqual(0);
    expect(p.angleDeg).toBeLessThan(360);
  });

  test('placement is deterministic and never moves with the rest of the corpus', () => {
    expect(placeNode('small-weather', [315, 45])).toEqual(placeNode('small-weather', [315, 45]));
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

  test('two nodes with identical axes no longer share a star', () => {
    const twins = [placeNode('one', [0, 45]), placeNode('one', [0, 45])];
    expect(gap(twins[0]!, twins[1]!)).toBeLessThan(0.095);
    const [a, b] = spreadPlacements(twins);
    expect(gap(a!, b!)).toBeGreaterThanOrEqual(0.094);
  });

  test('leaves already-separated placements where they are', () => {
    const apart = [placeNode('east', [0]), placeNode('west', [180])];
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

describe('capFor', () => {
  test("the site's handful of works keeps the default cap: their sky does not move", () => {
    expect(capFor(16)).toBe(DEFAULT_CAP);
    expect(capFor(60)).toBe(DEFAULT_CAP);
  });

  test('a vault of hundreds widens the cap at fixed spacing, its anchors in proportion', () => {
    const cap = capFor(258);
    expect(cap.radiusMax).toBeGreaterThan(RADIUS_MAX);
    expect(cap.radiusMax).toBeLessThanOrEqual(1);
    expect(cap.anchorRadius / cap.radiusMax).toBeCloseTo(DEFAULT_CAP.anchorRadius / RADIUS_MAX, 10);
    expect(capFor(400).radiusMax).toBeGreaterThan(cap.radiusMax);
  });

  test('the cap never passes the equator', () => {
    expect(capFor(5000).radiusMax).toBeCloseTo(1, 10);
  });

  test('a crowded slice places stars beyond the default dome', () => {
    const AT = '2026-09-03T00:00:00.000Z';
    const graph = graphFromSlice({
      space: 'crowd',
      asOf: AT,
      axes: [
        { id: 'n', name: 'north', azimuthDeg: 0 },
        { id: 's', name: 'south', azimuthDeg: 180 },
      ],
      nodes: Array.from({ length: 258 }, (_, i) => ({
        id: `c${i}`,
        title: `Claim ${i}`,
        kind: 'claim',
        axes: [i % 2 ? 'n' : 's'],
        createdAt: AT,
      })),
      edges: [],
      pending: { unresolved: 0, ghosts: [] },
    });
    expect(Math.max(...graph.nodes.map((n) => n.radius))).toBeGreaterThan(RADIUS_MAX);
  });
});
