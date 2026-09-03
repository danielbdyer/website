import type { KeyboardEvent, MouseEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { cameraBasis } from '@/shared/geometry/camera';
import { rubberBand } from '@/shared/geometry/elastic';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import {
  expMap,
  geodesicDistance,
  logMap,
  projectOntoTangentPlane,
  slerp,
  tangentTowards,
  unitVector,
} from '@/shared/geometry/sphere';
import { tangentHoldDirection, type NavigableNode } from '@/shared/geometry/wellPhysics';
import {
  TRAIL_LENGTH,
  broadcastCameraToFirmament,
  broadcastCursorToFirmament,
  markTrack,
  placeLabels,
  projectCompass,
  projectDaystar,
  projectGlyph,
  projectPole,
  projectStars,
  projectThreads,
  projectToViewbox,
  projectTrail,
  writeGlyphChannels,
  type NavigableEdge,
} from '@/shared/dom/skyProjector';
import { fitViewboxToCanvas } from '@/shared/webgl/atmosphereProjection';
import type { ConstellationGraph } from '@/shared/content/constellation';
import {
  POLE_KEY,
  REST_DISTANCE,
  findNode,
  neighborToward,
  placePosition,
  restDistanceFor,
  stepsFrom,
  type Place,
} from '@/shared/content/skyWalk';
import { readPersistedHere } from '@/shared/state/hereStorage';
import type { SkyWalk } from '@/shared/hooks/useSkyWalk';
import { chooseIntent, type IntentCandidate } from '@/shared/dom/intent';

// Destination travel across the constellation's latent sphere.
//
// The visitor is always somewhere — *here*, a star or the pole — and
// the camera rests there, far enough back that the whole sphere is in
// view through the oculus (the distance adapts to the frame). Travel
// begins only when a destination is named — a star, a bearing, a
// thread, an arrow, or a drag along a thread — and moves the camera's
// surface point along the great circle from here to there in a held
// second or two, on a sine glide with no change of distance: the
// crossing is a single unbroken gesture. Velocity is read from what
// streams past, not from a pulse of the lens — the atmosphere streaks
// its deep field along the travel's angular velocity, which this hook
// broadcasts with the camera. Arrival reports the new *here* to the
// organism, which draws the names and the whisper. Nothing pulls,
// drifts, coasts, or demonstrates on its own.
// CONSTELLATION_WALK.md §"Travel".
//
// The drag is a hand on the sky with two regimes in one gesture. Along
// a thread that leaves here — the illuminated line — the sky follows
// the finger one to one, without friction: pull the far star toward the
// center and it comes. In every other direction the sky gives like a
// rubber band, less the further it is pulled, and springs back to
// where the visitor stood when the hand lets go, with a little weight.
// Release past the midpoint of a track arrives there. The sky is never
// thrown. §"Input".
//
// The chart is still. The heavens' turn lives in the atmosphere now —
// the deep field and the weather drift on the wall clock behind the
// stars — so a bearing can be learned: beauty is up. The loop runs at
// full rate while traveling, scrubbing, springing, easing the rest
// distance, or while the gaze leans, and drops to an idle cadence
// otherwise. Reduced motion never runs the loop: travel is an instant
// arrival and the scene projects once.

interface UseSkyTravelArgs {
  readonly graph: ConstellationGraph;
  readonly nodes: readonly NavigableNode[];
  readonly edges: readonly NavigableEdge[];
  readonly viewboxSize: number;
  /** The SVG's fit inside its frame (mirrors preserveAspectRatio). */
  readonly fit: 'cover' | 'contain';
  /** The walk's state: where the visitor stands (travel follows a
   *  change of `here`), arrivals are reported to it, and while a hand
   *  holds the sky it is told what the hand is aiming at. */
  readonly walk: SkyWalk;
  /** The labels visible at rest, in priority order (here first); the
   *  label layout keeps them off each other. */
  readonly namedKeys: readonly string[];
  readonly cameraRef: RefObject<SVGGElement | null>;
  readonly glyphRef: RefObject<SVGCircleElement | null>;
}

// Travel duration scales with the distance: a neighbor is a held
// second, the far side of the dome two and a half (the Held register).
const TRAVEL_MIN_MS = 1100;
const TRAVEL_MAX_MS = 2400;
const TRAVEL_FULL_ANGLE_RAD = 1.3;
const CAMERA_FOV_Y = Math.PI / 4;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 10;
const WORLD_UP: UnitVector3 = { x: 0, y: 1, z: 0 };
// The gaze: the sky leans a little toward the cursor — the surface
// point the camera rests on slides by this much, easing in and out —
// so the space breathes with attention while the oculus itself holds
// still on the page.
const LOOK_LEAN = 0.04;
const LOOK_EASE_RATE = 5;
const LOOK_REST_EPSILON = 0.002;
// The rest distance eases when the frame changes shape (a resize, a
// rotation) rather than snapping.
const REST_EASE_RATE = 4;
const REST_EPSILON = 0.002;
const IDLE_TICK_MS = 100;
const MAX_DT_SECONDS = 0.1;
// A press becomes a drag after this much travel of the hand. Release
// past this fraction of a track arrives at its star. A track is taken
// when the hand's direction is within ~70° of it, and held once the
// hand has come this far along it.
const SCRUB_THRESHOLD_PX = 6;
const SCRUB_COMMIT = 0.5;
const TRACK_ALIGNMENT = 0.35;
const TRACK_HOLD = 0.25;
// The play. Along a track the sky follows the hand one to one; off it,
// this fraction — the graph is a groove, not a rail. The give only
// bites at the far end of a pull, so the sky never runs away.
const PLAY = 0.7;
const ELASTIC_LIMIT_VB = 380;
// The spring home: a little under-damped, so the return has weight
// and one small overshoot; the hand's parting velocity carries in,
// capped so a flick cannot throw the sky. The settle onto an aimed
// star is firmer, so it lands rather than bounces.
const SPRING_OMEGA = 13;
const SPRING_ZETA = 0.62;
const SNAP_OMEGA = 11;
const SNAP_ZETA = 0.8;
const SPRING_VELOCITY_CAP = 5;
const SPRING_REST_RAD = 1e-4;
// The click a drag ends with is not a click.
const CLICK_SUPPRESS_MS = 400;
// Labels are laid out on arrival and at this cadence at rest — the
// heavens turn too slowly for every frame to matter.
const LABEL_INTERVAL_MS = 1500;

interface MutableVec3 {
  x: number;
  y: number;
  z: number;
}

interface Travel {
  readonly from: UnitVector3;
  readonly to: UnitVector3;
  readonly toPlace: Place;
  readonly alongEdgeId: string | undefined;
  readonly startTime: number;
  readonly durationMs: number;
}

/** A thread a drag can follow: where it leads, and how it lies on
 *  screen (a unit direction from here to the destination and its
 *  length, in viewbox units) at the moment the hand took hold. */
interface Track {
  readonly toPlace: Place;
  readonly alongEdgeId: string | undefined;
  readonly to: UnitVector3;
  readonly dirX: number;
  readonly dirY: number;
  readonly length: number;
  readonly angle: number;
}

interface Scrub {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  /** The offset the sky already had when the hand took hold (a spring
   *  interrupted), so the grab does not jump. */
  readonly uBase: Vec3;
  engaged: boolean;
  tracks: readonly Track[];
  track: Track | null;
  /** The places one step from here, with the thread to each. */
  steps: ReadonlyMap<string, string | undefined>;
  /** The star nearest the center of view, in reach — the likely intent. */
  intent: string | null;
  /** Progress along the track ∈ [0, 1]. */
  t: number;
  /** The tangent offset from the anchor the hand currently holds. */
  u: MutableVec3;
  uPrev: MutableVec3;
  lastMoveAt: number;
}

/** A damped return: home to the anchor, or onto the star the hand
 *  aimed at, which becomes here when the spring settles. */
interface Spring {
  readonly to: UnitVector3;
  readonly place: Place | null;
  readonly alongEdgeId: string | undefined;
  readonly omega: number;
  readonly zeta: number;
  u: MutableVec3;
  v: MutableVec3;
}

interface TravelState {
  /** The camera's surface point — where the visitor is, on the sphere. */
  pos: MutableVec3;
  /** Where the visitor stands: the position of `here`. */
  anchor: MutableVec3;
  here: Place;
  look: { x: number; y: number };
  lookTarget: { x: number; y: number };
  restDistance: number;
  restTarget: number;
  travel: Travel | null;
  scrub: Scrub | null;
  spring: Spring | null;
  scrubEndedAt: number;
  /** The sky's world angular velocity this frame, for the streak. */
  omega: MutableVec3;
  currentCamera: Camera;
  currentBasis: CameraBasis;
  trailHistory: MutableVec3[];
  lastTime: number;
  lastSpeed: number;
  labelsAt: number;
  raf: number | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
  resize: ResizeObserver | null;
}

/** Everything the loop reads, gathered once so the effects and
 *  handlers close over one stable object rather than the latest
 *  props. The prop-shaped refs are refreshed after every render. */
interface Refs {
  readonly stateRef: RefObject<TravelState>;
  readonly graphRef: RefObject<ConstellationGraph>;
  readonly nodesRef: RefObject<readonly NavigableNode[]>;
  readonly edgesRef: RefObject<readonly NavigableEdge[]>;
  readonly namedRef: RefObject<readonly string[]>;
  readonly walkRef: RefObject<SkyWalk>;
  readonly viewboxRef: RefObject<number>;
  readonly fitRef: RefObject<'cover' | 'contain'>;
  readonly cameraRef: RefObject<SVGGElement | null>;
  readonly glyphRef: RefObject<SVGCircleElement | null>;
}

const ZERO: Vec3 = { x: 0, y: 0, z: 0 };

function prefersReducedMotion(): boolean {
  return (
    globalThis.window !== undefined &&
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

function orbitalCamera(surfacePos: UnitVector3, distance: number): Camera {
  return {
    position: {
      x: -surfacePos.x * distance,
      y: -surfacePos.y * distance,
      z: -surfacePos.z * distance,
    },
    target: { x: 0, y: 0, z: 0 },
    up: WORLD_UP,
    fovY: CAMERA_FOV_Y,
    near: CAMERA_NEAR,
    far: CAMERA_FAR,
    roll: 0,
  };
}

/** The glide: a half cosine — one unbroken gesture, no pulse. */
function easeInOutSine(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1);
}

function setVec(target: MutableVec3, v: Vec3): void {
  target.x = v.x;
  target.y = v.y;
  target.z = v.z;
}

/** The rotation axis carrying `from` onto `to`; zero when they coincide. */
function axisBetween(from: UnitVector3, to: UnitVector3): Vec3 {
  const x = from.y * to.z - from.z * to.y;
  const y = from.z * to.x - from.x * to.z;
  const z = from.x * to.y - from.y * to.x;
  const m = Math.hypot(x, y, z);
  return m < 1e-9 ? ZERO : { x: x / m, y: y / m, z: z / m };
}

function svgOf(refs: Refs): SVGSVGElement | null {
  return refs.cameraRef.current?.ownerSVGElement ?? null;
}

/** Radians of sky per viewbox unit at the center of view, for turning
 *  a screen displacement into a surface offset. */
function radiansPerViewboxUnit(state: TravelState, viewboxSize: number): number {
  return (Math.tan(CAMERA_FOV_Y / 2) * (state.restDistance + 1)) / (0.44 * viewboxSize);
}

function projectScene(state: TravelState, refs: Refs): void {
  const cameraGroup = refs.cameraRef.current;
  if (!cameraGroup) return;
  const { currentCamera: camera, currentBasis: basis } = state;
  const size = refs.viewboxRef.current;
  projectPole(cameraGroup, camera, basis, size);
  projectDaystar(cameraGroup.ownerSVGElement, size, refs.fitRef.current);
  projectCompass(cameraGroup, camera, basis, size);
  projectStars(cameraGroup, refs.nodesRef.current, camera, basis, size);
  projectThreads(cameraGroup, refs.edgesRef.current, camera, basis, size);
  const cursorProj = projectGlyph(refs.glyphRef.current, state.pos, camera, basis, size);
  projectTrail(cameraGroup, state.trailHistory, camera, basis, size);
  broadcastCursorToFirmament(cursorProj, size);
  broadcastCameraToFirmament(camera, basis, state.omega);
}

/** Rebuild the camera for the current surface point, leaned by the
 *  gaze, at the rest distance, then project. */
function placeCamera(state: TravelState, refs: Refs): void {
  const { right, up } = state.currentBasis;
  const gaze = unitVector(
    state.pos.x + (right.x * state.look.x + up.x * state.look.y) * LOOK_LEAN,
    state.pos.y + (right.y * state.look.x + up.y * state.look.y) * LOOK_LEAN,
    state.pos.z + (right.z * state.look.x + up.z * state.look.y) * LOOK_LEAN,
  );
  state.currentCamera = orbitalCamera(gaze, state.restDistance);
  state.currentBasis = cameraBasis(state.currentCamera);
  projectScene(state, refs);
}

function shiftTrail(state: TravelState): void {
  const tr = state.trailHistory;
  for (let i = tr.length - 1; i >= 1; i--) {
    tr[i]!.x = tr[i - 1]!.x;
    tr[i]!.y = tr[i - 1]!.y;
    tr[i]!.z = tr[i - 1]!.z;
  }
  setVec(tr[0]!, state.pos);
}

/** Arrive: the destination becomes here and the anchor, the labels
 *  re-lay, and the walk is told. */
function arriveAt(
  state: TravelState,
  refs: Refs,
  to: UnitVector3,
  place: Place,
  alongEdgeId?: string,
): void {
  setVec(state.pos, to);
  setVec(state.anchor, to);
  state.here = place;
  state.labelsAt = 0;
  refs.walkRef.current.arrive(place, alongEdgeId);
}

/** Advance an in-flight travel: glide the surface point along the
 *  great circle; on completion arrive. */
function advanceTravel(state: TravelState, refs: Refs, now: number): void {
  const travel = state.travel;
  if (!travel) return;
  const t = clamp01((now - travel.startTime) / travel.durationMs);
  setVec(state.pos, slerp(travel.from, travel.to, easeInOutSine(t)));
  if (t >= 1) {
    state.travel = null;
    arriveAt(state, refs, travel.to, travel.toPlace, travel.alongEdgeId);
  }
}

/** Let the spring carry the sky: home, or onto the aimed star. A
 *  damped oscillator on the tangent offset from where it settles,
 *  advanced in closed form so a long frame (a stall at release) lands
 *  where the spring would be, never past it. */
function advanceSpring(state: TravelState, refs: Refs, dt: number): void {
  const spring = state.spring;
  if (!spring || dt <= 0) return;
  const { u, v, omega, zeta } = spring;
  const decay = Math.exp(-zeta * omega * dt);
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  const cos = Math.cos(wd * dt);
  const sin = Math.sin(wd * dt);
  const step = (x: number, vx: number): [number, number] => {
    const b = (vx + zeta * omega * x) / wd;
    const next = decay * (x * cos + b * sin);
    const rate = decay * ((b * wd - zeta * omega * x) * cos - (x * wd + zeta * omega * b) * sin);
    return [next, rate];
  };
  [u.x, v.x] = step(u.x, v.x);
  [u.y, v.y] = step(u.y, v.y);
  [u.z, v.z] = step(u.z, v.z);
  if (Math.hypot(u.x, u.y, u.z) < SPRING_REST_RAD && Math.hypot(v.x, v.y, v.z) < 1e-3) {
    state.spring = null;
    if (spring.place !== null) {
      arriveAt(state, refs, spring.to, spring.place, spring.alongEdgeId);
    } else {
      setVec(state.pos, spring.to);
    }
    return;
  }
  setVec(state.pos, expMap(spring.to, u));
}

/** The sky's angular velocity this frame, from where it was to where
 *  it is — one measure for travel, the hand, and the spring alike. */
function measureMotion(state: TravelState, before: Vec3, dt: number): void {
  const angle = geodesicDistance(before, state.pos);
  const speed = dt > 0 ? angle / dt : 0;
  state.lastSpeed = speed;
  const axis = axisBetween(before, state.pos);
  setVec(state.omega, { x: axis.x * speed, y: axis.y * speed, z: axis.z * speed });
}

/** Ease the rest distance toward its target; returns the residual. */
function settleRest(state: TravelState, dt: number): number {
  const delta = state.restTarget - state.restDistance;
  state.restDistance += delta * (1 - Math.exp(-REST_EASE_RATE * dt));
  return Math.abs(state.restTarget - state.restDistance);
}

/** Lay the labels out when the sky is still — on arrival (labelsAt is
 *  zeroed) and at the idle cadence, since the heavens turn slowly. */
function maybePlaceLabels(state: TravelState, refs: Refs, now: number): void {
  if (state.travel || state.scrub || state.spring) return;
  if (now - state.labelsAt < LABEL_INTERVAL_MS) return;
  const cameraGroup = refs.cameraRef.current;
  if (!cameraGroup) return;
  placeLabels(
    cameraGroup,
    refs.namedRef.current,
    refs.nodesRef.current,
    state.currentCamera,
    state.currentBasis,
    refs.viewboxRef.current,
  );
  state.labelsAt = now;
}

function scheduleNext(state: TravelState, refs: Refs, resting: boolean): void {
  if (!resting) {
    state.raf = globalThis.requestAnimationFrame((t) => tick(t, refs));
    return;
  }
  // At rest the loop doesn't stop — the weather still turns — but
  // drops to the idle cadence until input wakes it (ensureRunning).
  state.raf = null;
  state.idleTimer = setTimeout(() => {
    state.idleTimer = null;
    state.raf = globalThis.requestAnimationFrame((t) => tick(t, refs));
  }, IDLE_TICK_MS);
}

function tick(now: number, refs: Refs): void {
  const state = refs.stateRef.current;
  const dt = state.lastTime === 0 ? 0 : Math.min((now - state.lastTime) / 1000, MAX_DT_SECONDS);
  state.lastTime = now;
  const before = { x: state.pos.x, y: state.pos.y, z: state.pos.z };
  advanceTravel(state, refs, now);
  advanceSpring(state, refs, dt);
  measureMotion(state, before, dt);
  shiftTrail(state);
  const lookT = 1 - Math.exp(-LOOK_EASE_RATE * dt);
  state.look.x += (state.lookTarget.x - state.look.x) * lookT;
  state.look.y += (state.lookTarget.y - state.look.y) * lookT;
  const restResidual = settleRest(state, dt);
  placeCamera(state, refs);
  // The glyph claims fully when standing on a star; the trail asserts
  // itself only while the sky moves.
  const held = state.travel !== null || state.scrub !== null || state.spring !== null;
  const aimed = state.scrub?.intent !== null && state.scrub?.intent !== undefined;
  writeGlyphChannels(refs.glyphRef.current, held && !aimed ? 0 : 1, state.lastSpeed);
  maybePlaceLabels(state, refs, now);
  const lookSettled =
    Math.abs(state.look.x - state.lookTarget.x) < LOOK_REST_EPSILON &&
    Math.abs(state.look.y - state.lookTarget.y) < LOOK_REST_EPSILON;
  scheduleNext(state, refs, !held && lookSettled && restResidual < REST_EPSILON);
}

function ensureRunning(refs: Refs): void {
  const state = refs.stateRef.current;
  if (state.raf !== null) return;
  if (state.idleTimer !== null) {
    clearTimeout(state.idleTimer);
    state.idleTimer = null;
  }
  state.lastTime = 0;
  state.raf = globalThis.requestAnimationFrame((t) => tick(t, refs));
}

function stopLoop(state: TravelState): void {
  if (state.raf !== null) globalThis.cancelAnimationFrame(state.raf);
  state.raf = null;
  if (state.idleTimer !== null) clearTimeout(state.idleTimer);
  state.idleTimer = null;
  state.resize?.disconnect();
  state.resize = null;
}

/** Begin travel toward a place. Under reduced motion the arrival is
 *  instant. A travel already in flight is retargeted from where the
 *  camera is now; a spring in flight is released. */
function travelTo(refs: Refs, place: Place, alongEdgeId?: string): void {
  const state = refs.stateRef.current;
  const to = placePosition(refs.graphRef.current, place);
  state.spring = null;
  if (prefersReducedMotion()) {
    for (const entry of state.trailHistory) setVec(entry, to);
    state.restDistance = state.restTarget;
    arriveAt(state, refs, to, place, alongEdgeId);
    placeCamera(state, refs);
    maybePlaceLabels(state, refs, globalThis.performance.now());
    return;
  }
  const from = { x: state.pos.x, y: state.pos.y, z: state.pos.z };
  const angle = geodesicDistance(from, to);
  const durationMs =
    TRAVEL_MIN_MS + (TRAVEL_MAX_MS - TRAVEL_MIN_MS) * clamp01(angle / TRAVEL_FULL_ANGLE_RAD);
  state.travel = {
    from,
    to,
    toPlace: place,
    alongEdgeId,
    startTime: globalThis.performance.now(),
    durationMs,
  };
  ensureRunning(refs);
}

function handleKeyDown(refs: Refs, e: KeyboardEvent): void {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const state = refs.stateRef.current;
  const direction = tangentHoldDirection(new Set([e.key]), state.currentBasis, state.pos);
  const next = neighborToward(refs.graphRef.current, state.here, direction);
  if (!next) return;
  e.preventDefault();
  travelTo(refs, next);
}

/** Viewbox units per client pixel for the SVG's current fit. */
function viewboxScale(refs: Refs): number {
  const svg = svgOf(refs);
  if (!svg) return 1;
  const rect = svg.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return 1;
  return fitViewboxToCanvas(rect.width, rect.height, refs.viewboxRef.current, refs.fitRef.current)
    .scale;
}

/** The tracks a hand can follow from here, as they lie on screen now. */
function tracksFrom(refs: Refs, state: TravelState): readonly Track[] {
  const graph = refs.graphRef.current;
  const size = refs.viewboxRef.current;
  const a = projectToViewbox(state.anchor, state.currentCamera, state.currentBasis, size);
  return stepsFrom(graph, state.here).flatMap((step) => {
    const to = placePosition(graph, step.key);
    const b = projectToViewbox(to, state.currentCamera, state.currentBasis, size);
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
        angle: geodesicDistance(state.anchor, to),
      },
    ];
  });
}

/** The track the hand's direction takes, if any lies near enough. The
 *  sky follows the finger, so pulling a star toward the center means
 *  moving the hand *against* that star's direction on screen. */
function chooseTrack(tracks: readonly Track[], hx: number, hy: number): Track | null {
  const m = Math.hypot(hx, hy);
  if (m < 1e-6) return null;
  const best = tracks.reduce<{ track: Track | null; score: number }>(
    (acc, track) => {
      const score = -(hx * track.dirX + hy * track.dirY) / m;
      return score > acc.score ? { track, score } : acc;
    },
    { track: null, score: TRACK_ALIGNMENT },
  );
  return best.track;
}

/** Turn the hand's displacement (viewbox units) into the tangent offset
 *  the sky takes: free along the track, elastic everywhere else. */
function holdOffset(state: TravelState, scrub: Scrub, hx: number, hy: number, size: number): void {
  const { track } = scrub;
  const basis = state.currentBasis;
  const along = track ? Math.max(-(hx * track.dirX + hy * track.dirY), 0) : 0;
  const onTrack = track ? Math.min(along, track.length) : 0;
  scrub.t = track ? onTrack / track.length : 0;
  // What is left of the hand once the track has taken its share.
  const ex = hx + (track ? track.dirX * onTrack : 0);
  const ey = hy + (track ? track.dirY * onTrack : 0);
  const eMag = Math.hypot(ex, ey);
  const give = rubberBand(eMag, ELASTIC_LIMIT_VB, PLAY);
  const k = eMag > 1e-6 ? (give / eMag) * radiansPerViewboxUnit(state, size) : 0;
  // The sky moves with the finger, so the camera's point moves against
  // it; screen y grows downward, so the up axis is subtracted.
  const elastic = projectOntoTangentPlane(
    {
      x: -(basis.right.x * ex - basis.up.x * ey) * k,
      y: -(basis.right.y * ex - basis.up.y * ey) * k,
      z: -(basis.right.z * ex - basis.up.z * ey) * k,
    },
    state.anchor,
  );
  const toward = track ? tangentTowards(state.anchor, track.to) : ZERO;
  const towardMag = Math.hypot(toward.x, toward.y, toward.z);
  const reach = track && towardMag > 1e-9 ? (scrub.t * track.angle) / towardMag : 0;
  setVec(scrub.uPrev, scrub.u);
  scrub.u.x = scrub.uBase.x + toward.x * reach + elastic.x;
  scrub.u.y = scrub.uBase.y + toward.y * reach + elastic.y;
  scrub.u.z = scrub.uBase.z + toward.z * reach + elastic.z;
  setVec(state.pos, expMap(state.anchor, scrub.u));
}

/** The hand has moved far enough: the sky is held. */
function engageScrub(refs: Refs, state: TravelState, scrub: Scrub): void {
  scrub.engaged = true;
  scrub.tracks = tracksFrom(refs, state);
  scrub.steps = new Map(
    stepsFrom(refs.graphRef.current, state.here).map((s) => [s.key, s.edgeId ?? undefined]),
  );
  const svg = svgOf(refs);
  if (!svg) return;
  svg.dataset.scrubbing = 'true';
  // Capture only once the hand has moved: a capture at the press would
  // retarget the click, and a tap on a star must stay the star's.
  svg.setPointerCapture(scrub.pointerId);
}

/** The reticle is the center of view. Whichever star sits nearest it,
 *  in reach, is what the hand is aiming at; a step along the graph
 *  gets a head start. The walk is told when it changes, so the star
 *  claims while the hand still holds the sky. */
function aim(refs: Refs, state: TravelState, scrub: Scrub): void {
  const size = refs.viewboxRef.current;
  const center = size / 2;
  const candidates = refs.nodesRef.current.flatMap((node): IntentCandidate[] => {
    if (node.key === state.here) return [];
    const p = projectToViewbox(node.unitPos, state.currentCamera, state.currentBasis, size);
    if (!p.inFront) return [];
    return [
      {
        key: node.key,
        distance: Math.hypot(p.x - center, p.y - center),
        step: scrub.steps.has(node.key),
      },
    ];
  });
  const intent = chooseIntent(candidates);
  if (intent === scrub.intent) return;
  scrub.intent = intent;
  refs.walkRef.current.aim(intent);
}

function lightTrack(refs: Refs, scrub: Scrub, next: Track | null): void {
  if (next === scrub.track) return;
  scrub.track = next;
  const cameraGroup = refs.cameraRef.current;
  if (cameraGroup) markTrack(cameraGroup, next?.alongEdgeId ?? null);
}

function beginScrub(refs: Refs, e: PointerEvent<SVGSVGElement>): void {
  if (e.button !== 0 || !e.isPrimary) return;
  const state = refs.stateRef.current;
  // Mid-flight the sky is not to be taken hold of; it is going somewhere.
  if (state.travel) return;
  const target = e.target as Element;
  // A press on the open sky selects nothing and focuses nothing; a press
  // on a star keeps the star's own behavior until the hand moves.
  if (!target.closest('a')) e.preventDefault();
  const uBase = state.spring ? { ...state.spring.u } : ZERO;
  state.spring = null;
  state.scrub = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    uBase,
    engaged: false,
    tracks: [],
    track: null,
    steps: new Map(),
    intent: null,
    t: 0,
    u: { ...uBase },
    uPrev: { ...uBase },
    lastMoveAt: globalThis.performance.now(),
  };
}

/** Carry the sky with the hand: freely along the track it takes,
 *  elastically everywhere else. */
function moveScrub(refs: Refs, e: PointerEvent<SVGSVGElement>): void {
  const state = refs.stateRef.current;
  const scrub = state.scrub;
  if (scrub?.pointerId !== e.pointerId) return;
  const dx = e.clientX - scrub.startX;
  const dy = e.clientY - scrub.startY;
  if (!scrub.engaged) {
    if (Math.hypot(dx, dy) < SCRUB_THRESHOLD_PX) return;
    engageScrub(refs, state, scrub);
  }
  const scale = viewboxScale(refs);
  const hx = dx / scale;
  const hy = dy / scale;
  // The track is chosen by the hand's direction and held once the hand
  // has come a way along it; before that it may change its mind.
  if (scrub.t < TRACK_HOLD) lightTrack(refs, scrub, chooseTrack(scrub.tracks, hx, hy));
  holdOffset(state, scrub, hx, hy, refs.viewboxRef.current);
  placeCamera(state, refs);
  aim(refs, state, scrub);
  scrub.lastMoveAt = globalThis.performance.now();
  ensureRunning(refs);
}

/** Release. Past the midpoint of a track, or with a star in the
 *  reticle's reach, the sky settles onto that star and it becomes
 *  here; otherwise it springs back to where the visitor stood. Either
 *  way it carries the hand's parting velocity. A cancelled pointer
 *  always springs back. */
function endScrub(refs: Refs, e: PointerEvent<SVGSVGElement>, cancelled: boolean): void {
  const state = refs.stateRef.current;
  const scrub = state.scrub;
  if (scrub?.pointerId !== e.pointerId) return;
  state.scrub = null;
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
  if (!scrub.engaged) return;
  const cameraGroup = refs.cameraRef.current;
  if (cameraGroup) markTrack(cameraGroup, null);
  delete e.currentTarget.dataset.scrubbing;
  if (scrub.intent !== null) refs.walkRef.current.aim(null);
  state.scrubEndedAt = globalThis.performance.now();
  const dt = Math.max((state.scrubEndedAt - scrub.lastMoveAt) / 1000, 1 / 120);
  const vRaw = {
    x: (scrub.u.x - scrub.uPrev.x) / dt,
    y: (scrub.u.y - scrub.uPrev.y) / dt,
    z: (scrub.u.z - scrub.uPrev.z) / dt,
  };
  const vm = Math.hypot(vRaw.x, vRaw.y, vRaw.z);
  const cap = vm > SPRING_VELOCITY_CAP ? SPRING_VELOCITY_CAP / vm : 1;
  const v = { x: vRaw.x * cap, y: vRaw.y * cap, z: vRaw.z * cap };
  const committed = scrub.track && scrub.t >= SCRUB_COMMIT ? scrub.track.toPlace : null;
  const place = cancelled ? null : (committed ?? scrub.intent);
  const alongEdgeId = place === null ? undefined : scrub.steps.get(place);
  const to = place === null ? state.anchor : placePosition(refs.graphRef.current, place);
  state.spring = {
    to,
    place,
    alongEdgeId,
    omega: place === null ? SPRING_OMEGA : SNAP_OMEGA,
    zeta: place === null ? SPRING_ZETA : SNAP_ZETA,
    u: { ...logMap(to, state.pos) },
    v,
  };
  ensureRunning(refs);
}

function handlePointerMove(refs: Refs, e: PointerEvent<SVGSVGElement>): void {
  const state = refs.stateRef.current;
  if (state.scrub) {
    moveScrub(refs, e);
    return;
  }
  if (prefersReducedMotion()) return;
  const bounds = e.currentTarget.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;
  // Inverted: moving toward an edge leans the sky the other way, so
  // the gesture reads as "head toward what I'm reaching for."
  state.lookTarget.x = -(((e.clientX - bounds.left) / bounds.width) * 2 - 1);
  state.lookTarget.y = ((e.clientY - bounds.top) / bounds.height) * 2 - 1;
  ensureRunning(refs);
}

function handlePointerLeave(refs: Refs): void {
  const state = refs.stateRef.current;
  state.lookTarget.x = 0;
  state.lookTarget.y = 0;
  if (!prefersReducedMotion()) ensureRunning(refs);
}

/** The click a drag ends with never reaches the stars. */
function handleClickCapture(refs: Refs, e: MouseEvent<SVGSVGElement>): void {
  const state = refs.stateRef.current;
  if (globalThis.performance.now() - state.scrubEndedAt < CLICK_SUPPRESS_MS) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/** Fit the resting camera to the frame now and whenever it changes
 *  shape. */
function watchFrame(refs: Refs): void {
  const state = refs.stateRef.current;
  const svg = svgOf(refs);
  if (!svg) return;
  const fitTo = (width: number, height: number) => {
    state.restTarget = restDistanceFor(width, height, refs.fitRef.current);
  };
  const rect = svg.getBoundingClientRect();
  fitTo(rect.width, rect.height);
  state.restDistance = state.restTarget;
  if (typeof ResizeObserver === 'undefined') return;
  state.resize = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect;
    if (!box) return;
    fitTo(box.width, box.height);
    if (prefersReducedMotion()) {
      state.restDistance = state.restTarget;
      placeCamera(state, refs);
    } else {
      ensureRunning(refs);
    }
  });
  state.resize.observe(svg);
}

/** Mount: fit the camera to the frame, project the sky from where the
 *  visitor stands, and start the loop (reduced motion projects once).
 *  Then the session's remembered place: prerendered markup cannot know
 *  it, so the sky opens at the pole and carries the visitor back to
 *  where they stood (CONSTELLATION_WALK.md §"The Walk's Memory"). A
 *  look-up jump — a non-pole `here` — wins over the memory. */
function mount(refs: Refs): () => void {
  const state = refs.stateRef.current;
  watchFrame(refs);
  if (prefersReducedMotion()) {
    placeCamera(state, refs);
    maybePlaceLabels(state, refs, globalThis.performance.now());
  } else {
    ensureRunning(refs);
  }
  const remembered = state.here === POLE_KEY ? readPersistedHere() : null;
  if (remembered && remembered !== POLE_KEY && findNode(refs.graphRef.current, remembered)) {
    travelTo(refs, remembered);
  }
  return () => stopLoop(state);
}

function buildInitialState(graph: ConstellationGraph, here: Place): TravelState {
  const start = placePosition(graph, here);
  const camera = orbitalCamera(start, REST_DISTANCE);
  return {
    pos: { x: start.x, y: start.y, z: start.z },
    anchor: { x: start.x, y: start.y, z: start.z },
    here,
    look: { x: 0, y: 0 },
    lookTarget: { x: 0, y: 0 },
    restDistance: REST_DISTANCE,
    restTarget: REST_DISTANCE,
    travel: null,
    scrub: null,
    spring: null,
    scrubEndedAt: -Infinity,
    omega: { x: 0, y: 0, z: 0 },
    currentCamera: camera,
    currentBasis: cameraBasis(camera),
    trailHistory: Array.from({ length: TRAIL_LENGTH }, () => ({ ...start })),
    lastTime: 0,
    lastSpeed: 0,
    labelsAt: 0,
    raf: null,
    idleTimer: null,
    resize: null,
  };
}

export function useSkyTravel({
  graph,
  nodes,
  edges,
  viewboxSize,
  fit,
  walk,
  namedKeys,
  cameraRef,
  glyphRef,
}: UseSkyTravelArgs) {
  const here = walk.here;
  const stateRef = useRef<TravelState>(buildInitialState(graph, here));
  const graphRef = useRef(graph);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const namedRef = useRef(namedKeys);
  const walkRef = useRef(walk);
  const viewboxRef = useRef(viewboxSize);
  const fitRef = useRef(fit);
  const refsRef = useRef<Refs>({
    stateRef,
    graphRef,
    nodesRef,
    edgesRef,
    namedRef,
    walkRef,
    viewboxRef,
    fitRef,
    cameraRef,
    glyphRef,
  });
  useEffect(() => {
    graphRef.current = graph;
    nodesRef.current = nodes;
    edgesRef.current = edges;
    namedRef.current = namedKeys;
    walkRef.current = walk;
    viewboxRef.current = viewboxSize;
    fitRef.current = fit;
  });

  useEffect(() => mount(refsRef.current), []);

  // A `here` set from outside the walk (a restored place, a focus jump)
  // is a destination like any other.
  useEffect(() => {
    const refs = refsRef.current;
    const state = refs.stateRef.current;
    if (state.here === here || state.travel?.toPlace === here) return;
    travelTo(refs, here);
  }, [here]);

  return {
    travelTo: (place: Place, alongEdgeId?: string) => travelTo(refsRef.current, place, alongEdgeId),
    onKeyDown: (e: KeyboardEvent) => handleKeyDown(refsRef.current, e),
    beginScrub: (e: PointerEvent<SVGSVGElement>) => beginScrub(refsRef.current, e),
    pointerHandlers: {
      onPointerMove: (e: PointerEvent<SVGSVGElement>) => handlePointerMove(refsRef.current, e),
      onPointerUp: (e: PointerEvent<SVGSVGElement>) => endScrub(refsRef.current, e, false),
      onPointerCancel: (e: PointerEvent<SVGSVGElement>) => endScrub(refsRef.current, e, true),
      onPointerLeave: () => handlePointerLeave(refsRef.current),
      onClickCapture: (e: MouseEvent<SVGSVGElement>) => handleClickCapture(refsRef.current, e),
    },
  };
}
