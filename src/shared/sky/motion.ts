// The sky's motion, as a pure state machine.
//
// Everything that moves the camera over time — a travel gliding from
// here to there, a hand holding the sky, a spring carrying it home or
// onto an aimed star, the gaze leaning toward the cursor, the rest
// distance easing to a new frame — is a value of one immutable type,
// `Motion`, and every change to it is a function from a motion and an
// input to the next motion. Time is an argument. Nothing here touches
// the DOM, React, or a clock; the shell (useSkyTravel) reads the clock,
// calls these, paints the result, and hands the events on.
// CONSTELLATION_ARCHITECTURE.md §"Motion".

import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { cameraBasis } from '@/shared/geometry/camera';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import { expMap, geodesicDistance, slerp, unitVector } from '@/shared/geometry/sphere';
import {
  springSettled,
  stepSpring,
  type SpringSpec,
  type SpringState,
} from '@/shared/geometry/spring';
import { REST_DISTANCE, type Place } from '@/shared/content/skyWalk';

// ─── Constants ─────────────────────────────────────────────────────

/** Travel duration scales with the distance: a neighbor is a held
 *  second, the far side of the dome two and a half. */
export const TRAVEL_MIN_MS = 1100;
export const TRAVEL_MAX_MS = 2400;
export const TRAVEL_FULL_ANGLE_RAD = 1.3;
export const CAMERA_FOV_Y = Math.PI / 4;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 10;
const WORLD_UP: UnitVector3 = { x: 0, y: 1, z: 0 };
/** The gaze: the surface point the camera rests on slides by this much
 *  toward the cursor, so the space breathes while the oculus holds still. */
export const LOOK_LEAN = 0.04;
const LOOK_EASE_RATE = 5;
const LOOK_REST_EPSILON = 0.002;
/** The rest distance eases when the frame changes shape. */
const REST_EASE_RATE = 4;
const REST_EPSILON = 0.002;
const MAX_DT_SECONDS = 0.1;
/** The spring home: a little under-damped, so the return has weight
 *  and one small overshoot. The settle onto an aimed star is firmer. */
export const HOME_SPRING: SpringSpec = { omega: 13, zeta: 0.62 };
export const SNAP_SPRING: SpringSpec = { omega: 11, zeta: 0.8 };

// ─── Types ─────────────────────────────────────────────────────────

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Travel {
  readonly from: UnitVector3;
  readonly to: UnitVector3;
  readonly toPlace: Place;
  readonly alongEdgeId: string | undefined;
  readonly startTime: number;
  readonly durationMs: number;
}

/** A spring carrying the sky to `to`: home (place null) or onto a star
 *  (place set), which becomes here when it settles. */
export interface Settle {
  readonly to: UnitVector3;
  readonly place: Place | null;
  readonly alongEdgeId: string | undefined;
  readonly spring: SpringState;
  readonly spec: SpringSpec;
}

/** What the sky is doing. `held` carries the hand (hand.ts). */
export type Phase =
  | { readonly kind: 'rest' }
  | { readonly kind: 'travel'; readonly travel: Travel }
  | { readonly kind: 'held'; readonly hand: Hand }
  | { readonly kind: 'settle'; readonly settle: Settle };

/** A thread a hand can follow: where it leads and how it lay on screen
 *  when the hand took hold (a unit direction from here to the star and
 *  its length, in viewbox units). */
export interface Track {
  readonly toPlace: Place;
  readonly alongEdgeId: string | undefined;
  readonly to: UnitVector3;
  readonly dirX: number;
  readonly dirY: number;
  readonly length: number;
  readonly angle: number;
}

/** A hand on the sky. Immutable; hand.ts returns new hands. */
export interface Hand {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  /** The offset the sky already had when the hand took hold. */
  readonly uBase: Vec3;
  readonly engaged: boolean;
  readonly tracks: readonly Track[];
  readonly track: Track | null;
  /** The places one step from here, with the thread to each. */
  readonly steps: ReadonlyMap<string, string | undefined>;
  /** The star nearest the center of view, in reach. */
  readonly intent: string | null;
  /** Progress along the track ∈ [0, 1]. */
  readonly t: number;
  /** The tangent offset from the anchor the hand holds, and the last. */
  readonly u: Vec3;
  readonly uPrev: Vec3;
  readonly lastMoveAt: number;
}

export interface Motion {
  readonly here: Place;
  /** The position of here. */
  readonly anchor: UnitVector3;
  /** The camera's surface point — where the visitor is, on the sphere. */
  readonly pos: UnitVector3;
  /** Where the surface point was at the last advance, for the streak. */
  readonly lastPos: UnitVector3;
  readonly look: Vec2;
  readonly lookTarget: Vec2;
  readonly rest: number;
  readonly restTarget: number;
  readonly phase: Phase;
  /** The sky's angular velocity over the last advance (rad/s). */
  readonly omega: Vec3;
  readonly speed: number;
  /** The clock at the last advance; 0 before the first. */
  readonly time: number;
  /** When a hand last let go, for the click that follows a drag. */
  readonly releasedAt: number;
}

export type MotionEvent =
  | { readonly kind: 'arrived'; readonly place: Place; readonly alongEdgeId: string | undefined }
  | { readonly kind: 'aimed'; readonly place: string | null };

export interface Advanced {
  readonly motion: Motion;
  readonly events: readonly MotionEvent[];
}

export const ZERO: Vec3 = { x: 0, y: 0, z: 0 };
const ORIGIN: Vec2 = { x: 0, y: 0 };

// ─── Construction ──────────────────────────────────────────────────

export function initialMotion(here: Place, at: UnitVector3, rest = REST_DISTANCE): Motion {
  return {
    here,
    anchor: at,
    pos: at,
    lastPos: at,
    look: ORIGIN,
    lookTarget: ORIGIN,
    rest,
    restTarget: rest,
    phase: { kind: 'rest' },
    omega: ZERO,
    speed: 0,
    time: 0,
    releasedAt: Number.NEGATIVE_INFINITY,
  };
}

// ─── The camera ────────────────────────────────────────────────────

// The camera stands on the far side of the sphere from the visitor's
// surface point and looks at that point through the center. Aiming at
// the point rather than the center is the same direction at every
// distance and stays defined at distance zero — the center of the
// sphere, where the dome overhead fills the frame (sky/dial.ts).
function orbitalCamera(surfacePos: UnitVector3, distance: number): Camera {
  return {
    position: {
      x: -surfacePos.x * distance,
      y: -surfacePos.y * distance,
      z: -surfacePos.z * distance,
    },
    target: { x: surfacePos.x, y: surfacePos.y, z: surfacePos.z },
    up: WORLD_UP,
    fovY: CAMERA_FOV_Y,
    near: CAMERA_NEAR,
    far: CAMERA_FAR,
    roll: 0,
  };
}

/** The camera for a motion: orbital, at the rest distance, its surface
 *  point leaned by the gaze. */
export function cameraOf(motion: Motion): { readonly camera: Camera; readonly basis: CameraBasis } {
  const level = cameraBasis(orbitalCamera(motion.pos, motion.rest));
  const { right, up } = level;
  const { look, pos } = motion;
  const gaze = unitVector(
    pos.x + (right.x * look.x + up.x * look.y) * LOOK_LEAN,
    pos.y + (right.y * look.x + up.y * look.y) * LOOK_LEAN,
    pos.z + (right.z * look.x + up.z * look.y) * LOOK_LEAN,
  );
  const camera = orbitalCamera(gaze, motion.rest);
  return { camera, basis: cameraBasis(camera) };
}

/** The camera standing at `pos` with the sky at `rest`, gaze level:
 *  what the dial measures the sky through (sky/dial.ts). */
export function cameraAt(
  pos: UnitVector3,
  rest: number,
): { readonly camera: Camera; readonly basis: CameraBasis } {
  const camera = orbitalCamera(pos, rest);
  return { camera, basis: cameraBasis(camera) };
}

/** Radians of sky per viewbox unit at the center of view. */
export function radiansPerViewboxUnit(motion: Motion, viewboxSize: number): number {
  return (Math.tan(CAMERA_FOV_Y / 2) * (motion.rest + 1)) / (0.44 * viewboxSize);
}

// ─── Small pure helpers ────────────────────────────────────────────

/** The glide: a half cosine — one unbroken gesture, no pulse. */
export function easeInOutSine(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1);
}

/** The rotation axis carrying `from` onto `to`; zero when they coincide. */
export function axisBetween(from: UnitVector3, to: UnitVector3): Vec3 {
  const x = from.y * to.z - from.z * to.y;
  const y = from.z * to.x - from.x * to.z;
  const z = from.x * to.y - from.y * to.x;
  const m = Math.hypot(x, y, z);
  return m < 1e-9 ? ZERO : { x: x / m, y: y / m, z: z / m };
}

/** Arrive: the place becomes here and the anchor; the sky rests. */
export function arrive(
  motion: Motion,
  to: UnitVector3,
  place: Place,
  alongEdgeId?: string,
): Advanced {
  return {
    motion: { ...motion, pos: to, anchor: to, here: place, phase: { kind: 'rest' } },
    events: [{ kind: 'arrived', place, alongEdgeId }],
  };
}

// ─── Transitions the shell requests ────────────────────────────────

/** Begin travel toward a place, from wherever the sky is now. Under
 *  reduced motion the arrival is immediate. */
export function travelTo(
  motion: Motion,
  to: UnitVector3,
  place: Place,
  now: number,
  alongEdgeId: string | undefined,
  reduced: boolean,
): Advanced {
  if (reduced) return arrive({ ...motion, rest: motion.restTarget }, to, place, alongEdgeId);
  const angle = geodesicDistance(motion.pos, to);
  const durationMs =
    TRAVEL_MIN_MS + (TRAVEL_MAX_MS - TRAVEL_MIN_MS) * clamp01(angle / TRAVEL_FULL_ANGLE_RAD);
  const travel: Travel = {
    from: motion.pos,
    to,
    toPlace: place,
    alongEdgeId,
    startTime: now,
    durationMs,
  };
  return { motion: { ...motion, phase: { kind: 'travel', travel } }, events: [] };
}

export function fitRest(motion: Motion, restTarget: number, snap = false): Motion {
  return { ...motion, restTarget, rest: snap ? restTarget : motion.rest };
}

export function lookToward(motion: Motion, x: number, y: number): Motion {
  return { ...motion, lookTarget: { x, y } };
}

// ─── Advancing time ────────────────────────────────────────────────

function advanceTravel(motion: Motion, travel: Travel, now: number): Advanced {
  const t = clamp01((now - travel.startTime) / travel.durationMs);
  if (t >= 1) return arrive(motion, travel.to, travel.toPlace, travel.alongEdgeId);
  return {
    motion: { ...motion, pos: slerp(travel.from, travel.to, easeInOutSine(t)) },
    events: [],
  };
}

function advanceSettle(motion: Motion, settle: Settle, dt: number): Advanced {
  const spring = stepSpring(settle.spring, settle.spec, dt);
  if (springSettled(spring)) {
    if (settle.place !== null) return arrive(motion, settle.to, settle.place, settle.alongEdgeId);
    return { motion: { ...motion, pos: settle.to, phase: { kind: 'rest' } }, events: [] };
  }
  return {
    motion: {
      ...motion,
      pos: expMap(settle.to, spring.u),
      phase: { kind: 'settle', settle: { ...settle, spring } },
    },
    events: [],
  };
}

function advancePhase(motion: Motion, now: number, dt: number): Advanced {
  const { phase } = motion;
  if (phase.kind === 'travel') return advanceTravel(motion, phase.travel, now);
  if (phase.kind === 'settle') return advanceSettle(motion, phase.settle, dt);
  return { motion, events: [] };
}

function ease(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

/** The sky `now`: the phase advanced, the gaze and rest eased, and the
 *  motion of the surface point since the last advance measured for the
 *  atmosphere's streak. */
export function advance(motion: Motion, now: number): Advanced {
  const dt = motion.time === 0 ? 0 : Math.min((now - motion.time) / 1000, MAX_DT_SECONDS);
  const stepped = advancePhase(motion, now, dt);
  const m = stepped.motion;
  const angle = geodesicDistance(motion.pos, m.pos);
  const speed = dt > 0 ? angle / dt : 0;
  const axis = axisBetween(motion.pos, m.pos);
  return {
    motion: {
      ...m,
      lastPos: motion.pos,
      look: {
        x: ease(m.look.x, m.lookTarget.x, LOOK_EASE_RATE, dt),
        y: ease(m.look.y, m.lookTarget.y, LOOK_EASE_RATE, dt),
      },
      rest: ease(m.rest, m.restTarget, REST_EASE_RATE, dt),
      omega: { x: axis.x * speed, y: axis.y * speed, z: axis.z * speed },
      speed,
      time: now,
    },
    events: stepped.events,
  };
}

/** Whether nothing is moving: the sky rests, the gaze and the rest
 *  distance have settled. The shell drops to its idle cadence then. */
export function isStill(motion: Motion): boolean {
  return (
    motion.phase.kind === 'rest' &&
    Math.abs(motion.look.x - motion.lookTarget.x) < LOOK_REST_EPSILON &&
    Math.abs(motion.look.y - motion.lookTarget.y) < LOOK_REST_EPSILON &&
    Math.abs(motion.rest - motion.restTarget) < REST_EPSILON
  );
}

/** Whether a hand holds the sky or a spring is carrying it. */
export function isHeld(motion: Motion): boolean {
  return motion.phase.kind === 'held' || motion.phase.kind === 'settle';
}
