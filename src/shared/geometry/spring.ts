// A damped spring on a three-vector, in closed form.
//
// The sky's returns — home after a hand lets go, or onto the star the
// hand aimed at — are damped oscillators on a tangent offset. Each
// axis is advanced analytically, so a step of any length lands exactly
// where the spring would be at that time: a stalled frame cannot
// overshoot, and the same spring can be integrated at 120 Hz or 10 Hz
// and arrive at the same place. Pure: state in, state out.

import type { Vec3 } from './sphere';

export interface SpringState {
  /** The offset from where the spring settles. */
  readonly u: Vec3;
  /** Its rate of change. */
  readonly v: Vec3;
}

/** Natural frequency (rad/s) and damping ratio (< 1: under-damped,
 *  with overshoot; nearer 1: firmer). */
export interface SpringSpec {
  readonly omega: number;
  readonly zeta: number;
}

const MAX_ZETA = 0.999;

function stepAxis(x: number, vx: number, spec: SpringSpec, dt: number): readonly [number, number] {
  const zeta = Math.min(spec.zeta, MAX_ZETA);
  const { omega } = spec;
  const decay = Math.exp(-zeta * omega * dt);
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  const cos = Math.cos(wd * dt);
  const sin = Math.sin(wd * dt);
  const b = (vx + zeta * omega * x) / wd;
  const next = decay * (x * cos + b * sin);
  const rate = decay * ((b * wd - zeta * omega * x) * cos - (x * wd + zeta * omega * b) * sin);
  return [next, rate];
}

/** The spring `dt` seconds later. */
export function stepSpring(state: SpringState, spec: SpringSpec, dt: number): SpringState {
  if (dt <= 0) return state;
  const [ux, vx] = stepAxis(state.u.x, state.v.x, spec, dt);
  const [uy, vy] = stepAxis(state.u.y, state.v.y, spec, dt);
  const [uz, vz] = stepAxis(state.u.z, state.v.z, spec, dt);
  return { u: { x: ux, y: uy, z: uz }, v: { x: vx, y: vy, z: vz } };
}

/** Whether the spring has come to rest within the given tolerances. */
export function springSettled(state: SpringState, restU = 1e-4, restV = 1e-3): boolean {
  return (
    Math.hypot(state.u.x, state.u.y, state.u.z) < restU &&
    Math.hypot(state.v.x, state.v.y, state.v.z) < restV
  );
}
