import { describe, expect, test } from 'vitest';
import type { ConstellationGraph, ConstellationNode } from '@/shared/content/constellation';
import { diskToHemisphere } from '@/shared/geometry/sphere';
import {
  CENTER,
  SKY_RADIUS,
  buildPositionedMap,
  nodeKey,
  polarToCartesian,
  presentationOrder,
  skyTitle,
} from './layout';

const projectToSphere = (angleDeg: number, radius: number) =>
  diskToHemisphere(radius, (angleDeg * Math.PI) / 180);

const NODE_A: ConstellationNode = {
  room: 'garden',
  slug: 'small-weather',
  title: 'small weather',
  date: new Date('2026-04-24'),
  facets: ['relation'],
  posture: undefined,
  isPreview: false,
  angleDeg: 135,
  radius: 0.6,
  unitPosition: projectToSphere(135, 0.6),
  hue: 'gold',
  twinklePhase: 1.2,
};

const NODE_B: ConstellationNode = {
  ...NODE_A,
  room: 'studio',
  slug: 'a-second-work',
  title: 'a second work',
  date: new Date('2026-05-01'),
  hue: 'rose',
};

describe('layout — polar/cartesian', () => {
  test('center maps to (CENTER, CENTER) at radius 0', () => {
    const { x, y } = polarToCartesian(0, 0);
    expect(x).toBe(CENTER);
    expect(y).toBe(CENTER);
  });

  test('east at radius 1 lands at the east rim', () => {
    const { x, y } = polarToCartesian(0, 1);
    expect(x).toBe(CENTER + SKY_RADIUS);
    expect(y).toBeCloseTo(CENTER, 5);
  });

  test('south at radius 1 lands at the south rim (Y grows downward)', () => {
    const { x, y } = polarToCartesian(90, 1);
    expect(x).toBeCloseTo(CENTER, 5);
    expect(y).toBeCloseTo(CENTER + SKY_RADIUS, 5);
  });
});

describe('layout — buildPositionedMap', () => {
  const graph: ConstellationGraph = {
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
    nodes: [NODE_A, NODE_B],
    edges: [],
  };

  test('keys nodes by room/slug and attaches xy coordinates', () => {
    const map = buildPositionedMap(graph);
    expect(map.size).toBe(2);
    const a = map.get('garden/small-weather');
    expect(a).toBeDefined();
    expect(typeof a?.x).toBe('number');
    expect(typeof a?.y).toBe('number');
  });

  test('every positioned node carries a depth in [0, 1]', () => {
    const map = buildPositionedMap(graph);
    for (const node of map.values()) {
      expect(node.depth).toBeGreaterThanOrEqual(0);
      expect(node.depth).toBeLessThanOrEqual(1);
    }
  });

  test('a node at the polestar (radius = 0) projects to viewbox center', () => {
    const center: ConstellationNode = {
      ...NODE_A,
      slug: 'centered',
      angleDeg: 0,
      radius: 0,
      unitPosition: projectToSphere(0, 0),
    };
    const map = buildPositionedMap({ ...graph, nodes: [center] });
    const placed = map.get('garden/centered');
    expect(placed?.x).toBeCloseTo(CENTER, 6);
    expect(placed?.y).toBeCloseTo(CENTER, 6);
  });
});

describe('layout — presentationOrder', () => {
  test('sorts by room ascending then by date descending within a room', () => {
    const garden2 = { ...NODE_A, slug: 'newer', date: new Date('2026-05-15') };
    const ordered = presentationOrder([NODE_A, NODE_B, garden2]);
    // garden < studio alphabetically
    expect(ordered[0]?.room).toBe('garden');
    expect(ordered[1]?.room).toBe('garden');
    // Within garden, newer first
    expect(ordered[0]?.slug).toBe('newer');
    expect(ordered[2]?.room).toBe('studio');
  });
});

describe('layout — nodeKey', () => {
  test('produces room/slug', () => {
    expect(nodeKey({ room: 'salon', slug: 'klimt' })).toBe('salon/klimt');
  });
});

describe('layout — skyTitle', () => {
  test('uses singular form for one work', () => {
    expect(skyTitle(1)).toMatch(/1 work\b/);
  });

  test('uses plural form for zero or multiple works', () => {
    expect(skyTitle(0)).toMatch(/0 works/);
    expect(skyTitle(7)).toMatch(/7 works/);
  });
});
