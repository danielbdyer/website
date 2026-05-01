import { describe, expect, test } from 'vitest';
import { getConstellationGraphSync } from './constellation';

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

  test('every node carries valid polar coordinates', () => {
    const g = getConstellationGraphSync();
    for (const node of g.nodes) {
      expect(node.angleDeg).toBeGreaterThanOrEqual(0);
      expect(node.angleDeg).toBeLessThan(360);
      expect(node.radius).toBeGreaterThanOrEqual(0.45);
      expect(node.radius).toBeLessThanOrEqual(0.92);
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
});
