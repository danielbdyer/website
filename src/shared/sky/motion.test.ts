import { describe, expect, test } from 'vitest';
import { NORTH_POLE, geodesicDistance, unitVector } from '@/shared/geometry/sphere';
import {
  HOME_SPRING,
  TRAVEL_MIN_MS,
  advance,
  arrive,
  cameraOf,
  fitRest,
  initialMotion,
  isHeld,
  isStill,
  lookToward,
  travelTo,
  type Motion,
  type MotionEvent,
  type Settle,
} from './motion';

const STAR = unitVector(0.5, 0.2, 0.84);
const start = initialMotion('pole', NORTH_POLE, 3.85);

interface Run {
  readonly motion: Motion;
  readonly events: readonly MotionEvent[];
}

function runUntil(motion: Motion, from: number, to: number, step: number): Run {
  return Array.from({ length: Math.ceil((to - from) / step) }).reduce<Run>(
    (acc, _, i) => {
      const next = advance(acc.motion, from + (i + 1) * step);
      return { motion: next.motion, events: [...acc.events, ...next.events] };
    },
    { motion: { ...motion, time: from }, events: [] },
  );
}

describe('motion — travel', () => {
  test('a travel glides from here to there and arrives exactly, once', () => {
    const { motion } = travelTo(start, STAR, 'garden/x', 1000, 'e1', false);
    expect(motion.phase.kind).toBe('travel');
    const mid = advance({ ...motion, time: 1000 }, 1000 + TRAVEL_MIN_MS / 2).motion;
    expect(geodesicDistance(NORTH_POLE, mid.pos)).toBeGreaterThan(0);
    expect(geodesicDistance(mid.pos, STAR)).toBeGreaterThan(0);
    const done = runUntil(motion, 1000, 1000 + TRAVEL_MIN_MS + 1400, 16);
    expect(done.motion.phase.kind).toBe('rest');
    expect(done.motion.here).toBe('garden/x');
    expect(done.motion.pos).toEqual(STAR);
    expect(done.motion.anchor).toEqual(STAR);
    expect(done.events.filter((e) => e.kind === 'arrived')).toEqual([
      { kind: 'arrived', place: 'garden/x', alongEdgeId: 'e1' },
    ]);
  });

  test('under reduced motion the arrival is immediate', () => {
    const { motion, events } = travelTo(start, STAR, 'garden/x', 0, undefined, true);
    expect(motion.pos).toEqual(STAR);
    expect(motion.here).toBe('garden/x');
    expect(events).toEqual([{ kind: 'arrived', place: 'garden/x', alongEdgeId: undefined }]);
  });

  test('the streak measures the motion between advances and rests at rest', () => {
    const { motion } = travelTo(start, STAR, 'garden/x', 0, undefined, false);
    const moving = advance(advance({ ...motion, time: 0 }, 300).motion, 316).motion;
    expect(moving.speed).toBeGreaterThan(0);
    expect(Math.hypot(moving.omega.x, moving.omega.y, moving.omega.z)).toBeCloseTo(moving.speed, 6);
    const rested = advance(advance(start, 16).motion, 32).motion;
    expect(rested.speed).toBe(0);
  });
});

describe('motion — settle, gaze, rest', () => {
  test('a settle onto a star arrives when the spring lands; home does not', () => {
    const homeSettle: Settle = {
      to: NORTH_POLE,
      place: null,
      alongEdgeId: undefined,
      spring: { u: { x: 0.1, y: 0, z: 0 }, v: { x: 0, y: 0, z: 0 } },
      spec: HOME_SPRING,
    };
    const settling: Motion = {
      ...start,
      pos: unitVector(0.1, 0, 1),
      phase: { kind: 'settle', settle: homeSettle },
    };
    expect(isHeld(settling)).toBe(true);
    const home = runUntil(settling, 0, 1500, 16);
    expect(home.motion.phase.kind).toBe('rest');
    expect(home.motion.pos).toEqual(NORTH_POLE);
    expect(home.events).toEqual([]);
    const onto = runUntil(
      {
        ...settling,
        phase: { kind: 'settle', settle: { ...homeSettle, to: STAR, place: 'garden/x' } },
      },
      0,
      1500,
      16,
    );
    expect(onto.motion.here).toBe('garden/x');
    expect(onto.events.some((e) => e.kind === 'arrived')).toBe(true);
  });

  test('the gaze and the rest distance ease toward their targets and then the sky is still', () => {
    const leaned = fitRest(lookToward(start, 1, -1), 4.2);
    expect(isStill(leaned)).toBe(false);
    const settled = runUntil(leaned, 0, 3000, 16).motion;
    expect(settled.look.x).toBeCloseTo(1, 2);
    expect(settled.rest).toBeCloseTo(4.2, 2);
    expect(isStill(settled)).toBe(true);
    expect(isStill(fitRest(start, 4.2, true))).toBe(true);
  });

  test('the camera orbits the surface point at the rest distance and leans with the gaze', () => {
    const { camera } = cameraOf(start);
    expect(Math.hypot(camera.position.x, camera.position.y, camera.position.z)).toBeCloseTo(
      3.85,
      9,
    );
    const leaned = cameraOf({ ...start, look: { x: 1, y: 0 } }).camera;
    expect(leaned.position.x).not.toBeCloseTo(camera.position.x, 6);
  });

  test('arrive is the one door: here, anchor, pos, rest, and the event', () => {
    const { motion, events } = arrive(start, STAR, 'garden/x');
    expect(motion.here).toBe('garden/x');
    expect(motion.anchor).toEqual(STAR);
    expect(motion.phase.kind).toBe('rest');
    expect(events).toHaveLength(1);
  });
});
