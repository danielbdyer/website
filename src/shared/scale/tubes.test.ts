import { describe, expect, test } from 'vitest';
import {
  bend,
  bendsOf,
  lengthOf,
  pointsOf,
  pose,
  resample,
  SAMPLES,
  smooth,
  turn,
  turnAt,
  wave,
} from './tubes';

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe('a straw is held two ways', () => {
  test('bends integrate back to the points they came from', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 3, y: 14 },
    ];
    const back = pointsOf(bendsOf(points));
    points.forEach((p, i) => {
      expect(near(back[i]?.x ?? Number.NaN, p.x)).toBe(true);
      expect(near(back[i]?.y ?? Number.NaN, p.y)).toBe(true);
    });
  });

  test('the shortest turn between headings never exceeds a half turn', () => {
    expect(near(turn(0, Math.PI / 2), Math.PI / 2)).toBe(true);
    expect(near(turn(Math.PI - 0.1, -Math.PI + 0.1), 0.2)).toBe(true);
    expect(near(turn(0.1, -0.1), -0.2)).toBe(true);
  });
});

describe('shaping a pose', () => {
  test('a smoothed path passes through its control points', () => {
    const control = [
      { x: 0, y: 0 },
      { x: 50, y: 40 },
      { x: 100, y: 0 },
    ];
    const smoothed = smooth(control, 4);
    expect(smoothed[0]).toEqual(control[0]);
    expect(smoothed[4]).toEqual(control[1]);
    expect(smoothed.at(-1)).toEqual(control[2]);
  });

  test('resampling spaces the points evenly along the path', () => {
    const points = resample(
      [
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 40 },
      ],
      8,
    );
    expect(points).toHaveLength(8);
    const steps = points.slice(1).map((p, i) => Math.hypot(p.x - points[i]!.x, p.y - points[i]!.y));
    steps.forEach((s) => expect(near(s, 10, 1e-6)).toBe(true));
    expect(points.at(-1)).toEqual({ x: 30, y: 40 });
  });

  test('a pose has SAMPLES points', () => {
    expect(
      pose([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ]),
    ).toHaveLength(SAMPLES);
  });
});

describe('the morph', () => {
  const straight = pose([
    { x: 0, y: 0 },
    { x: 400, y: 0 },
  ]);
  const hooked = pose([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 200 },
    { x: 0, y: 200 },
  ]);

  test('the ends of a bend are the two poses', () => {
    const at0 = bend(straight, hooked, 0, 'head');
    const at1 = bend(straight, hooked, 1, 'head');
    at0.forEach((p, i) =>
      expect(near(p.x, straight[i]!.x, 1e-6) && near(p.y, straight[i]!.y, 1e-6)).toBe(true),
    );
    at1.forEach((p, i) =>
      expect(near(p.x, hooked[i]!.x, 1e-3) && near(p.y, hooked[i]!.y, 1e-3)).toBe(true),
    );
  });

  test('a straw bends; it never stretches or melts: its length is between the two', () => {
    const lo = Math.min(lengthOf(straight), lengthOf(hooked));
    const hi = Math.max(lengthOf(straight), lengthOf(hooked));
    [0.2, 0.5, 0.8].forEach((t) => {
      const l = lengthOf(bend(straight, hooked, t, 'head'));
      expect(l).toBeGreaterThanOrEqual(lo - 1e-6);
      expect(l).toBeLessThanOrEqual(hi + 1e-6);
    });
  });

  test('the fold wave runs from the head on entry and from the tail on exit', () => {
    expect(wave(0.3, 0, 9, 0.5, 'head')).toBeGreaterThan(wave(0.3, 8, 9, 0.5, 'head'));
    expect(wave(0.3, 8, 9, 0.5, 'tail')).toBeGreaterThan(wave(0.3, 0, 9, 0.5, 'tail'));
    expect(wave(1, 8, 9, 0.5, 'head')).toBe(1);
    expect(wave(0, 0, 9, 0.5, 'tail')).toBe(0);
  });

  test('the turn at a point is the elbow the painter ribs', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(near(turnAt(points, 1), Math.PI / 2)).toBe(true);
    expect(turnAt(points, 0)).toBe(0);
  });
});
