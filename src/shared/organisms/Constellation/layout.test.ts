import { describe, expect, test } from 'vitest';
import { figure, relation, sky, star } from '@/test/sky-graph';
import {
  CENTER,
  SKY_RADIUS,
  buildPositionedMap,
  groupLabelOf,
  polarToCartesian,
  presentationOrder,
  resolveEdges,
  skyTitle,
} from './layout';

const NODE_A = star('garden/small-weather', ['relation'], 135, 0.6, {
  title: 'small weather',
  date: new Date('2026-04-24'),
  twinklePhase: 1.2,
});

const NODE_B = star('studio/a-second-work', ['beauty'], 225, 0.7, {
  title: 'a second work',
  date: new Date('2026-05-01'),
});

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
  const graph = sky([NODE_A, NODE_B], []);

  test('keys nodes by their key and attaches xy coordinates', () => {
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
    const center = star('garden/centered', ['relation'], 0, 0);
    const map = buildPositionedMap({ ...graph, nodes: [center] });
    const placed = map.get('garden/centered');
    expect(placed?.x).toBeCloseTo(CENTER, 6);
    expect(placed?.y).toBeCloseTo(CENTER, 6);
  });
});

describe('layout — presentationOrder', () => {
  test('sorts by group ascending then by date descending within a group; ungrouped last', () => {
    const garden2 = star('garden/newer', ['relation'], 100, 0.5, { date: new Date('2026-05-15') });
    const loose = star('a-claim', [], 10, 0.3);
    const ordered = presentationOrder([NODE_A, NODE_B, garden2, loose]);
    // garden < studio alphabetically
    expect(ordered[0]?.group).toBe('garden');
    expect(ordered[1]?.group).toBe('garden');
    // Within garden, newer first
    expect(ordered[0]?.key).toBe('garden/newer');
    expect(ordered[2]?.group).toBe('studio');
    expect(ordered[3]?.key).toBe('a-claim');
  });
});

describe('layout — groupLabelOf', () => {
  test("names the house's rooms and passes other groups through", () => {
    expect(groupLabelOf('salon')).toBe('The Salon');
    expect(groupLabelOf('recognition')).toBe('recognition');
    expect(groupLabelOf(null)).toBeNull();
  });
});

describe('layout — resolveEdges', () => {
  test("a figure's stroke keeps its axis's hue and dotting; a relation draws in ink", () => {
    const graph = sky(
      [NODE_A, NODE_B],
      [
        figure('garden/small-weather', 'studio/a-second-work', 'relation'),
        relation('garden/small-weather', 'studio/a-second-work'),
      ],
    );
    const edges = resolveEdges(graph, buildPositionedMap(graph));
    expect(edges).toHaveLength(2);
    const stroke = edges.find((e) => e.axis === 'relation');
    expect(stroke).toMatchObject({ hue: 'gold', dotted: true, origin: 'emergent' });
    expect(stroke?.id).toBe('garden/small-weather|studio/a-second-work|relation');
    const link = edges.find((e) => e.axis === null);
    expect(link).toMatchObject({ hue: null, dotted: false, origin: 'declared' });
    expect(link?.id).toBe('garden/small-weather|studio/a-second-work|references');
  });

  test('drops an edge whose end is not positioned', () => {
    const graph = sky([NODE_A], [figure('garden/small-weather', 'studio/gone', 'relation')]);
    expect(resolveEdges(graph, buildPositionedMap(graph))).toEqual([]);
  });
});

describe('layout — skyTitle', () => {
  test('uses singular form for one star', () => {
    expect(skyTitle(1)).toMatch(/1 star\b/);
  });

  test('uses plural form for zero or multiple stars', () => {
    expect(skyTitle(0)).toMatch(/0 stars/);
    expect(skyTitle(7)).toMatch(/7 stars/);
  });
});
