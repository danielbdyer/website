import { describe, expect, test } from 'vitest';
import { springSettled, stepSpring, type SpringSpec, type SpringState } from './spring';

const HOME: SpringSpec = { omega: 13, zeta: 0.62 };
const FIRM: SpringSpec = { omega: 11, zeta: 0.8 };
const pulled: SpringState = { u: { x: 0.2, y: 0, z: 0 }, v: { x: 0, y: 0, z: 0 } };

function run(state: SpringState, spec: SpringSpec, dt: number, steps: number): SpringState[] {
  return Array.from({ length: steps }).reduce<SpringState[]>(
    (acc) => [...acc, stepSpring(acc.at(-1) ?? state, spec, dt)],
    [],
  );
}

describe('stepSpring', () => {
  test('comes home and settles within half a second', () => {
    const trace = run(pulled, HOME, 1 / 60, 30);
    expect(Math.abs(trace.at(-1)!.u.x)).toBeLessThan(0.002);
    expect(springSettled(run(pulled, HOME, 1 / 60, 90).at(-1)!)).toBe(true);
  });

  test('under-damped: one small overshoot, never a large one', () => {
    const trace = run(pulled, HOME, 1 / 60, 60);
    const lowest = Math.min(...trace.map((s) => s.u.x));
    expect(lowest).toBeLessThan(0);
    expect(Math.abs(lowest)).toBeLessThan(0.2 * 0.2);
  });

  test('a firmer spring overshoots less', () => {
    const home = Math.min(...run(pulled, HOME, 1 / 60, 60).map((s) => s.u.x));
    const firm = Math.min(...run(pulled, FIRM, 1 / 60, 60).map((s) => s.u.x));
    expect(Math.abs(firm)).toBeLessThan(Math.abs(home));
  });

  test('closed form: one long step lands where sixty short ones do', () => {
    const fine = run(pulled, HOME, 1 / 600, 60).at(-1)!;
    const coarse = stepSpring(pulled, HOME, 0.1);
    expect(coarse.u.x).toBeCloseTo(fine.u.x, 6);
    expect(coarse.v.x).toBeCloseTo(fine.v.x, 5);
  });

  test('a zero step is the identity, and rest is rest', () => {
    expect(stepSpring(pulled, HOME, 0)).toBe(pulled);
    expect(springSettled({ u: { x: 0, y: 0, z: 0 }, v: { x: 0, y: 0, z: 0 } })).toBe(true);
    expect(springSettled(pulled)).toBe(false);
  });
});
