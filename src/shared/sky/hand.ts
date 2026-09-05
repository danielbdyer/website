// A hand on the sky, as pure transitions of the motion.
//
// grab → (move …) → release. The sky follows the hand: one to one along
// a thread that leaves here, at PLAY in any other direction, giving like
// a rubber band only at the far end of a pull. The center of view is a
// reticle: whichever star comes nearest it, in reach, is the likely
// intent, and the walk is told so the star can claim while the hand
// still holds the sky. On release the sky settles onto that star, or
// onto the track's star past the midpoint, or springs home. Every
// function here takes a motion and returns a new one; the shell owns
// pointer capture, DOM marks, and the clock.
// CONSTELLATION_ARCHITECTURE.md §"The hand".

import type { ConstellationGraph } from '@/shared/content/constellation';
import { placePosition, stepsFrom, type Place } from '@/shared/content/skyWalk';
import { chooseIntent, type IntentCandidate } from '@/shared/dom/intent';
import { rubberBand } from '@/shared/geometry/elastic';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import {
  expMap,
  geodesicDistance,
  logMap,
  projectOntoTangentPlane,
  tangentTowards,
} from '@/shared/geometry/sphere';
import { toViewbox } from '@/shared/geometry/viewbox';
import {
  HOME_SPRING,
  SNAP_SPRING,
  ZERO,
  cameraOf,
  radiansPerViewboxUnit,
  type Advanced,
  type Hand,
  type Motion,
  type Track,
} from './motion';

// ─── Constants ─────────────────────────────────────────────────────

/** A press becomes a drag after this much travel of the hand (px). */
export const SCRUB_THRESHOLD_PX = 6;
/** With no star in the reticle's reach, a release between these
 *  fractions of a track still arrives at the track's star. */
export const SCRUB_COMMIT = 0.5;
export const SCRUB_OVERRUN = 1.5;
/** A track is taken when the hand's direction is within ~70° of it,
 *  and held once the hand has come this far along it. */
export const TRACK_ALIGNMENT = 0.35;
export const TRACK_HOLD = 0.25;
/** The play: off a track the sky follows the hand at this fraction —
 *  the graph is a groove, not a rail. */
export const PLAY = 0.7;
/** Within this much of a pull (viewbox units) the play is exact; beyond
 *  it the sky gives like a rubber band with this much further reach. */
export const ELASTIC_FREE_VB = 320;
export const ELASTIC_LIMIT_VB = 240;
/** The hand's parting velocity carries into the spring, capped so a
 *  flick cannot throw the sky. */
export const SPRING_VELOCITY_CAP = 5;

/** What the shell knows about the frame: viewbox size and CSS pixels
 *  per viewbox unit under the current fit. */
export interface Viewport {
  readonly size: number;
  readonly scale: number;
}

export interface Pointer {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

// ─── Taking hold ───────────────────────────────────────────────────

/** A press. If a spring was carrying the sky, the hand takes hold where
 *  the sky is, so the grab does not jump. The hand is not yet engaged;
 *  a tap stays a tap. */
export function grab(motion: Motion, pointer: Pointer, now: number): Motion {
  const uBase = motion.phase.kind === 'settle' ? logMap(motion.anchor, motion.pos) : ZERO;
  const hand: Hand = {
    pointerId: pointer.id,
    startX: pointer.x,
    startY: pointer.y,
    uBase,
    engaged: false,
    tracks: [],
    track: null,
    steps: new Map(),
    intent: null,
    t: 0,
    u: uBase,
    uPrev: uBase,
    lastMoveAt: now,
  };
  return { ...motion, phase: { kind: 'held', hand } };
}

export function handOf(motion: Motion): Hand | null {
  return motion.phase.kind === 'held' ? motion.phase.hand : null;
}

/** The tracks a hand can follow from here, as they lie on screen now. */
export function tracksFrom(
  motion: Motion,
  graph: ConstellationGraph,
  size: number,
): readonly Track[] {
  const { camera, basis } = cameraOf(motion);
  const a = toViewbox(motion.anchor, camera, basis, size);
  return stepsFrom(graph, motion.here).flatMap((step): Track[] => {
    const to = placePosition(graph, step.key);
    const b = toViewbox(to, camera, basis, size);
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (!b.inFront || length < 1) return [];
    return [
      {
        toPlace: step.key,
        alongEdgeId: step.edgeId ?? undefined,
        to,
        dirX: (b.x - a.x) / length,
        dirY: (b.y - a.y) / length,
        length,
        angle: geodesicDistance(motion.anchor, to),
      },
    ];
  });
}

function engage(motion: Motion, hand: Hand, graph: ConstellationGraph, size: number): Hand {
  return {
    ...hand,
    engaged: true,
    tracks: tracksFrom(motion, graph, size),
    steps: new Map(stepsFrom(graph, motion.here).map((s) => [s.key, s.edgeId ?? undefined])),
  };
}

// ─── Following the hand ────────────────────────────────────────────

/** The track the hand's direction takes, if any lies near enough. The
 *  sky follows the finger, so pulling a star toward the center means
 *  moving the hand *against* that star's direction on screen. */
export function chooseTrack(tracks: readonly Track[], hx: number, hy: number): Track | null {
  const m = Math.hypot(hx, hy);
  if (m < 1e-6) return null;
  return tracks.reduce<{ track: Track | null; score: number }>(
    (best, track) => {
      const score = -(hx * track.dirX + hy * track.dirY) / m;
      return score > best.score ? { track, score } : best;
    },
    { track: null, score: TRACK_ALIGNMENT },
  ).track;
}

/** The hand's displacement (viewbox units) as the tangent offset the
 *  sky takes: free along the track, at PLAY everywhere else. */
export function holdOffset(
  motion: Motion,
  hand: Hand,
  hx: number,
  hy: number,
  size: number,
): { readonly u: Vec3; readonly t: number } {
  const { track } = hand;
  // The hand is read in the frame of the camera at rest on the anchor,
  // not the moved one, so the mapping cannot drift as the sky follows.
  const { basis } = cameraOf({ ...motion, pos: motion.anchor });
  // Along the track the hand is followed one to one — and past the
  // track's star too, so a third star on the same line can be reached.
  const onTrack = track ? Math.max(-(hx * track.dirX + hy * track.dirY), 0) : 0;
  const t = track ? onTrack / track.length : 0;
  // What is left of the hand once the track has taken its share.
  const ex = hx + (track ? track.dirX * onTrack : 0);
  const ey = hy + (track ? track.dirY * onTrack : 0);
  const eMag = Math.hypot(ex, ey);
  const free = Math.min(eMag, ELASTIC_FREE_VB);
  const give = PLAY * free + rubberBand(eMag - free, ELASTIC_LIMIT_VB, PLAY);
  const k = eMag > 1e-6 ? (give / eMag) * radiansPerViewboxUnit(motion, size) : 0;
  // The sky moves with the finger, so the camera's point moves against
  // it; screen y grows downward, so the up axis is subtracted.
  const elastic = projectOntoTangentPlane(
    {
      x: -(basis.right.x * ex - basis.up.x * ey) * k,
      y: -(basis.right.y * ex - basis.up.y * ey) * k,
      z: -(basis.right.z * ex - basis.up.z * ey) * k,
    },
    motion.anchor,
  );
  const toward = track ? tangentTowards(motion.anchor, track.to) : ZERO;
  const towardMag = Math.hypot(toward.x, toward.y, toward.z);
  const reach = track && towardMag > 1e-9 ? (t * track.angle) / towardMag : 0;
  return {
    t,
    u: {
      x: hand.uBase.x + toward.x * reach + elastic.x,
      y: hand.uBase.y + toward.y * reach + elastic.y,
      z: hand.uBase.z + toward.z * reach + elastic.z,
    },
  };
}

/** The reticle is the center of view. Whichever star sits nearest it,
 *  in reach, is what the hand is aiming at; a step along the graph gets
 *  a head start. */
export function aimOf(
  motion: Motion,
  hand: Hand,
  graph: ConstellationGraph,
  size: number,
): string | null {
  const { camera, basis } = cameraOf(motion);
  const center = size / 2;
  const candidates = graph.nodes.flatMap((node): IntentCandidate[] => {
    const key = node.key;
    if (key === motion.here) return [];
    const p = toViewbox(node.unitPosition, camera, basis, size);
    if (!p.inFront) return [];
    return [{ key, distance: Math.hypot(p.x - center, p.y - center), step: hand.steps.has(key) }];
  });
  return chooseIntent(candidates);
}

/** The hand has moved. Below the threshold nothing happens; past it the
 *  sky is held and follows. Returns the motion and an `aimed` event
 *  when the intent changes. */
export function moveHand(
  motion: Motion,
  pointer: Pointer,
  graph: ConstellationGraph,
  viewport: Viewport,
  now: number,
): Advanced {
  const held = handOf(motion);
  if (held?.pointerId !== pointer.id) return { motion, events: [] };
  const dx = pointer.x - held.startX;
  const dy = pointer.y - held.startY;
  if (!held.engaged && Math.hypot(dx, dy) < SCRUB_THRESHOLD_PX) return { motion, events: [] };
  const hand = held.engaged ? held : engage(motion, held, graph, viewport.size);
  const hx = dx / viewport.scale;
  const hy = dy / viewport.scale;
  // The track is chosen by the hand's direction and held once the hand
  // has come a way along it; before that it may change its mind.
  const track = hand.t < TRACK_HOLD ? chooseTrack(hand.tracks, hx, hy) : hand.track;
  const { u, t } = holdOffset(motion, { ...hand, track }, hx, hy, viewport.size);
  const moved: Motion = { ...motion, pos: expMap(motion.anchor, u) };
  const intent = aimOf(moved, hand, graph, viewport.size);
  const next: Hand = { ...hand, track, t, u, uPrev: hand.u, intent, lastMoveAt: now };
  return {
    motion: { ...moved, phase: { kind: 'held', hand: next } },
    events: intent === hand.intent ? [] : [{ kind: 'aimed', place: intent }],
  };
}

// ─── Letting go ────────────────────────────────────────────────────

/** Release. With a star in the reticle's reach the sky settles onto it
 *  and it becomes here when the spring lands — whatever the track; a
 *  hand far along a track with nothing in reach settles onto the
 *  track's star; otherwise the sky springs back to where the visitor
 *  stood. Either way it carries the hand's parting velocity. A
 *  cancelled pointer always springs back. An unengaged hand (a tap)
 *  simply lets go. */
export function releaseHand(
  motion: Motion,
  pointerId: number,
  graph: ConstellationGraph,
  cancelled: boolean,
  now: number,
): Advanced {
  const hand = handOf(motion);
  if (hand?.pointerId !== pointerId) return { motion, events: [] };
  if (!hand.engaged) return { motion: { ...motion, phase: { kind: 'rest' } }, events: [] };
  const dt = Math.max((now - hand.lastMoveAt) / 1000, 1 / 120);
  const raw = {
    x: (hand.u.x - hand.uPrev.x) / dt,
    y: (hand.u.y - hand.uPrev.y) / dt,
    z: (hand.u.z - hand.uPrev.z) / dt,
  };
  const vm = Math.hypot(raw.x, raw.y, raw.z);
  const cap = vm > SPRING_VELOCITY_CAP ? SPRING_VELOCITY_CAP / vm : 1;
  const v = { x: raw.x * cap, y: raw.y * cap, z: raw.z * cap };
  // The reticle decides. The track's star is a fallback for a hand that
  // came far along the track but left nothing in reach.
  const onTrack =
    hand.track && hand.t >= SCRUB_COMMIT && hand.t <= SCRUB_OVERRUN ? hand.track.toPlace : null;
  const place: Place | null = cancelled ? null : (hand.intent ?? onTrack);
  const to: UnitVector3 = place === null ? motion.anchor : placePosition(graph, place);
  return {
    motion: {
      ...motion,
      releasedAt: now,
      phase: {
        kind: 'settle',
        settle: {
          to,
          place,
          alongEdgeId: place === null ? undefined : hand.steps.get(place),
          spring: { u: logMap(to, motion.pos), v },
          spec: place === null ? HOME_SPRING : SNAP_SPRING,
        },
      },
    },
    events: hand.intent === null ? [] : [{ kind: 'aimed', place: null }],
  };
}
