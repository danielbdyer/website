import { describe, expect, test } from 'vitest';
import {
  SCARF_AT_REST,
  STRAND_COUNT,
  scarfPaths,
  strandShapes,
  type ScarfShape,
} from './scarfGeometry';

const CX = 120;
const CY = 120;

const pointsOf = (d: string): readonly (readonly [number, number])[] =>
  [...d.matchAll(/[ML] (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);

describe('scarfPaths — a silk ribbon about the face', () => {
  test('draws closed pieces behind and in front of the face', () => {
    const paths = scarfPaths(SCARF_AT_REST, CX, CY);
    expect(paths.behind.length).toBeGreaterThan(0);
    expect(paths.front.length).toBeGreaterThan(0);
    for (const d of [paths.behind, paths.front, paths.sheenBehind, paths.sheenFront]) {
      expect(d.startsWith('M ')).toBe(true);
      expect(d.trim().endsWith('Z')).toBe(true);
    }
  });

  test('a flat orbit lies wholly in front; there is nothing behind', () => {
    const flat: ScarfShape = { ...SCARF_AT_REST, tilt: 0 };
    const paths = scarfPaths(flat, CX, CY);
    expect(paths.behind).toBe('');
    expect(paths.sheenBehind).toBe('');
    expect(paths.front.length).toBeGreaterThan(0);
  });

  test('the tails taper to nothing: the two edges meet at either end', () => {
    const flat: ScarfShape = { ...SCARF_AT_REST, tilt: 0, wave: 0 };
    const pts = pointsOf(scarfPaths(flat, CX, CY, 20).front);
    // One piece: 21 left points forward, 21 right points back.
    expect(pts).toHaveLength(42);
    const head = pts[0]!;
    const headBack = pts[41]!;
    const tail = pts[20]!;
    const tailBack = pts[21]!;
    expect(Math.hypot(head[0] - headBack[0], head[1] - headBack[1])).toBeLessThan(0.3);
    expect(Math.hypot(tail[0] - tailBack[0], tail[1] - tailBack[1])).toBeLessThan(0.3);
    // And it is fullest in the middle.
    const mid = pts[10]!;
    const midBack = pts[31]!;
    expect(Math.hypot(mid[0] - midBack[0], mid[1] - midBack[1])).toBeGreaterThan(
      SCARF_AT_REST.width * 1.2,
    );
  });

  test('the ribbon orbits the center at its radius, seen through the lens', () => {
    const flat: ScarfShape = { ...SCARF_AT_REST, tilt: 0, wave: 0, width: 0 };
    const pts = pointsOf(scarfPaths(flat, CX, CY, 16).front);
    for (const [x, y] of pts) {
      expect(Math.hypot(x - CX, y - CY)).toBeCloseTo(SCARF_AT_REST.radius, 0);
    }
  });

  test('is a pure function of its shape', () => {
    const a = scarfPaths({ ...SCARF_AT_REST, phase: 1.2, wavePhase: 0.4 }, CX, CY);
    const b = scarfPaths({ ...SCARF_AT_REST, phase: 1.2, wavePhase: 0.4 }, CX, CY);
    expect(a).toEqual(b);
    const moved = scarfPaths({ ...SCARF_AT_REST, phase: 1.3, wavePhase: 0.4 }, CX, CY);
    expect(moved.front).not.toBe(a.front);
  });
});

describe('strandShapes — the main strand and its wisps', () => {
  test('three strands: the main one first, then two thinner wisps on their own phases', () => {
    const strands = strandShapes(SCARF_AT_REST);
    expect(strands).toHaveLength(STRAND_COUNT);
    expect(strands[0]).toBe(SCARF_AT_REST);
    for (const wisp of strands.slice(1)) {
      expect(wisp.width).toBeLessThan(SCARF_AT_REST.width * 0.5);
      expect(wisp.length).toBeLessThan(SCARF_AT_REST.length);
      expect(wisp.phase).not.toBe(SCARF_AT_REST.phase);
      expect(wisp.wavePhase).not.toBe(SCARF_AT_REST.wavePhase);
    }
    // One ahead of the main strand on the orbit, one behind.
    expect(strands[1]!.phase).toBeGreaterThan(SCARF_AT_REST.phase);
    expect(strands[2]!.phase).toBeLessThan(SCARF_AT_REST.phase);
  });

  test('the wisps follow the main strand: advance it, and they advance with it', () => {
    const later = { ...SCARF_AT_REST, phase: SCARF_AT_REST.phase + 1 };
    const [, a] = strandShapes(SCARF_AT_REST);
    const [, b] = strandShapes(later);
    expect(b!.phase - a!.phase).toBeCloseTo(1);
    // Pure: the main shape is untouched.
    expect(SCARF_AT_REST.phase).toBe(0);
  });
});
