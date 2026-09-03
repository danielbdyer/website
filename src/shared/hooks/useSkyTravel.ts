import type { KeyboardEvent, MouseEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { cameraBasis } from '@/shared/geometry/camera';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import {
  geodesicDistance,
  projectOntoTangentPlane,
  slerp,
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
  neighborsOf,
  placePosition,
  restDistanceFor,
  type Place,
} from '@/shared/content/skyWalk';
import { readPersistedHere } from '@/shared/state/hereStorage';

// Destination travel across the constellation's latent sphere.
//
// The visitor is always somewhere — *here*, a star or the pole — and
// the camera rests there, far enough back that the whole populated
// dome is in view (the distance adapts to the frame so a phone crops
// nothing). Travel begins only when a destination is named — a star,
// a bearing, a thread, an arrow, or a drag along a thread — and moves
// the camera's surface point along the great circle from here to
// there in a held second or two, on a sine glide with no change of
// distance: the crossing is a single unbroken gesture. Velocity is
// read from what streams past, not from a pulse of the lens — the
// atmosphere streaks its deep field along the travel's angular
// velocity, which this hook broadcasts with the camera. Arrival
// reports the new *here* to the organism, which draws the names and
// the whisper. Nothing pulls, drifts, coasts, or demonstrates on its
// own. CONSTELLATION_WALK.md §"Travel".
//
// The drag is a scrub along a track: a press on the open sky picks
// the thread that leaves here in the hand's direction (or the thread
// under the hand), and the hand then carries the visitor along it;
// release past the midpoint arrives, before it returns. The sky is
// never thrown. §"Input".
//
// The chart is still. The heavens' turn lives in the atmosphere now —
// the deep field and the weather drift on the wall clock behind the
// stars — so a bearing can be learned: beauty is up. The loop runs at
// full rate while traveling, scrubbing, easing the rest distance, or
// while the gaze leans, and drops to an idle cadence otherwise.
// Reduced motion never runs the loop: travel is an instant arrival and
// the scene projects once.

interface UseSkyTravelArgs {
  readonly graph: ConstellationGraph;
  readonly nodes: readonly NavigableNode[];
  readonly edges: readonly NavigableEdge[];
  readonly viewboxSize: number;
  /** The SVG's fit inside its frame (mirrors preserveAspectRatio). */
  readonly fit: 'cover' | 'contain';
  readonly here: Place;
  /** The labels visible at rest, in priority order (here first); the
   *  label layout keeps them off each other. */
  readonly namedKeys: readonly string[];
  /** Called when travel completes (or immediately under reduced
   *  motion) with the place arrived at and the edge traveled along,
   *  if the travel followed a thread. */
  readonly onArrive: (place: Place, alongEdgeId?: string) => void;
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
// A press becomes a scrub after this much travel of the hand; release
// past this fraction of the track arrives, before it returns.
const SCRUB_THRESHOLD_PX = 6;
const SCRUB_COMMIT = 0.5;
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
  /** Rotation axis from `from` to `to`, and the angle between them. */
  readonly axis: Vec3;
  readonly angle: number;
}

interface Scrub {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  /** The thread under the hand when it pressed, if any. */
  readonly fromThread: string | null;
  engaged: boolean;
  from: UnitVector3;
  to: UnitVector3;
  toPlace: Place;
  alongEdgeId: string | undefined;
  /** The track's direction and length on screen, in viewbox units. */
  dirX: number;
  dirY: number;
  length: number;
  t: number;
  axis: Vec3;
  angle: number;
}

interface TravelState {
  /** The camera's surface point — where the visitor is, on the sphere. */
  pos: MutableVec3;
  here: Place;
  roll: number;
  look: { x: number; y: number };
  lookTarget: { x: number; y: number };
  restDistance: number;
  restTarget: number;
  travel: Travel | null;
  scrub: Scrub | null;
  scrubEndedAt: number;
  /** The travel's world angular velocity this frame, for the streak. */
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
  readonly onArriveRef: RefObject<UseSkyTravelArgs['onArrive']>;
  readonly viewboxRef: RefObject<number>;
  readonly fitRef: RefObject<'cover' | 'contain'>;
  readonly cameraRef: RefObject<SVGGElement | null>;
  readonly glyphRef: RefObject<SVGCircleElement | null>;
}

function prefersReducedMotion(): boolean {
  return (
    globalThis.window !== undefined &&
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

function orbitalCamera(surfacePos: UnitVector3, distance: number, roll: number): Camera {
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
    roll,
  };
}

/** The glide: a half cosine — one unbroken gesture, no pulse. */
function easeInOutSine(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

/** Its rate of change, for the travel's angular speed. */
function easeInOutSineRate(t: number): number {
  return 0.5 * Math.PI * Math.sin(Math.PI * t);
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
  return m < 1e-9 ? { x: 0, y: 0, z: 0 } : { x: x / m, y: y / m, z: z / m };
}

function svgOf(refs: Refs): SVGSVGElement | null {
  return refs.cameraRef.current?.ownerSVGElement ?? null;
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
  state.currentCamera = orbitalCamera(gaze, state.restDistance, 0);
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

/** Advance an in-flight travel: glide the surface point along the
 *  great circle and carry its angular velocity for the streak; on
 *  completion settle exactly on the destination and report the
 *  arrival. */
function advanceTravel(state: TravelState, refs: Refs, now: number, dt: number): void {
  const travel = state.travel;
  if (!travel) {
    if (!state.scrub) setVec(state.omega, { x: 0, y: 0, z: 0 });
    return;
  }
  const t = clamp01((now - travel.startTime) / travel.durationMs);
  const before = { x: state.pos.x, y: state.pos.y, z: state.pos.z };
  setVec(state.pos, slerp(travel.from, travel.to, easeInOutSine(t)));
  state.lastSpeed = dt > 0 ? geodesicDistance(before, state.pos) / dt : 0;
  const speed = (travel.angle * easeInOutSineRate(t)) / (travel.durationMs / 1000);
  setVec(state.omega, {
    x: travel.axis.x * speed,
    y: travel.axis.y * speed,
    z: travel.axis.z * speed,
  });
  if (t >= 1) {
    setVec(state.pos, travel.to);
    setVec(state.omega, { x: 0, y: 0, z: 0 });
    state.travel = null;
    state.here = travel.toPlace;
    state.lastSpeed = 0;
    state.labelsAt = 0;
    refs.onArriveRef.current?.(travel.toPlace, travel.alongEdgeId);
  }
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
  if (state.travel || state.scrub) return;
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
  // At rest the loop doesn't stop — the heavens still turn — but drops
  // to the idle cadence until input wakes it (ensureRunning).
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
  advanceTravel(state, refs, now, dt);
  shiftTrail(state);
  const lookT = 1 - Math.exp(-LOOK_EASE_RATE * dt);
  state.look.x += (state.lookTarget.x - state.look.x) * lookT;
  state.look.y += (state.lookTarget.y - state.look.y) * lookT;
  const restResidual = settleRest(state, dt);
  placeCamera(state, refs);
  // The glyph claims fully when standing on a star; the trail asserts
  // itself only while traveling.
  writeGlyphChannels(refs.glyphRef.current, state.travel || state.scrub ? 0 : 1, state.lastSpeed);
  maybePlaceLabels(state, refs, now);
  const lookSettled =
    Math.abs(state.look.x - state.lookTarget.x) < LOOK_REST_EPSILON &&
    Math.abs(state.look.y - state.lookTarget.y) < LOOK_REST_EPSILON;
  const resting =
    state.travel === null && state.scrub === null && lookSettled && restResidual < REST_EPSILON;
  scheduleNext(state, refs, resting);
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
 *  camera is now. */
function travelTo(refs: Refs, place: Place, alongEdgeId?: string): void {
  const state = refs.stateRef.current;
  const to = placePosition(refs.graphRef.current, place);
  if (prefersReducedMotion()) {
    setVec(state.pos, to);
    state.here = place;
    for (const entry of state.trailHistory) setVec(entry, to);
    state.restDistance = state.restTarget;
    placeCamera(state, refs);
    state.labelsAt = 0;
    maybePlaceLabels(state, refs, globalThis.performance.now());
    refs.onArriveRef.current?.(place, alongEdgeId);
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
    axis: axisBetween(from, to),
    angle,
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

/** Which thread a scrub follows. The thread under the hand, when it
 *  leaves here; otherwise the neighbor (or bearing's end) that lies in
 *  the hand's direction on screen. */
function scrubDestination(
  refs: Refs,
  dxVb: number,
  dyVb: number,
  fromThread: string | null,
): { toPlace: Place; alongEdgeId: string | undefined } | null {
  const state = refs.stateRef.current;
  const graph = refs.graphRef.current;
  const neighbors = neighborsOf(graph, state.here);
  const underHand = fromThread ? neighbors.find((n) => n.edgeId === fromThread) : undefined;
  if (underHand) return { toPlace: underHand.key, alongEdgeId: underHand.edgeId };
  const { right, up } = state.currentBasis;
  const world = projectOntoTangentPlane(
    {
      x: right.x * dxVb - up.x * dyVb,
      y: right.y * dxVb - up.y * dyVb,
      z: right.z * dxVb - up.z * dyVb,
    },
    state.pos,
  );
  if (Math.hypot(world.x, world.y, world.z) < 1e-9) return null;
  const toPlace = neighborToward(graph, state.here, unitVector(world.x, world.y, world.z));
  if (!toPlace) return null;
  return { toPlace, alongEdgeId: neighbors.find((n) => n.key === toPlace)?.edgeId };
}

/** The hand has moved far enough: choose the track and light it. */
function engageScrub(refs: Refs, scrub: Scrub, dxVb: number, dyVb: number): boolean {
  const state = refs.stateRef.current;
  const destination = scrubDestination(refs, dxVb, dyVb, scrub.fromThread);
  if (!destination) return false;
  const graph = refs.graphRef.current;
  const from = placePosition(graph, state.here);
  const to = placePosition(graph, destination.toPlace);
  const size = refs.viewboxRef.current;
  const a = projectToViewbox(from, state.currentCamera, state.currentBasis, size);
  const b = projectToViewbox(to, state.currentCamera, state.currentBasis, size);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < 1) return false;
  scrub.engaged = true;
  scrub.from = from;
  scrub.to = to;
  scrub.toPlace = destination.toPlace;
  scrub.alongEdgeId = destination.alongEdgeId;
  scrub.dirX = (b.x - a.x) / length;
  scrub.dirY = (b.y - a.y) / length;
  scrub.length = length;
  scrub.axis = axisBetween(from, to);
  scrub.angle = geodesicDistance(from, to);
  const cameraGroup = refs.cameraRef.current;
  if (cameraGroup) markTrack(cameraGroup, scrub.alongEdgeId ?? null);
  const svg = svgOf(refs);
  if (svg) svg.dataset.scrubbing = 'true';
  return true;
}

function beginScrub(refs: Refs, e: PointerEvent<SVGSVGElement>): void {
  if (e.button !== 0 || !e.isPrimary) return;
  const target = e.target as Element;
  // A press on a star is the star's own (click, focus, drag-the-link).
  if (target.closest('a')) return;
  const state = refs.stateRef.current;
  state.scrub = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    fromThread: target.closest<SVGGElement>('[data-thread]')?.dataset.thread ?? null,
    engaged: false,
    from: state.pos,
    to: state.pos,
    toPlace: state.here,
    alongEdgeId: undefined,
    dirX: 1,
    dirY: 0,
    length: 1,
    t: 0,
    axis: { x: 0, y: 0, z: 0 },
    angle: 0,
  };
  e.currentTarget.setPointerCapture(e.pointerId);
}

/** Carry the visitor along the track by the hand's progress. */
function moveScrub(refs: Refs, e: PointerEvent<SVGSVGElement>, dt: number): void {
  const state = refs.stateRef.current;
  const scrub = state.scrub;
  if (scrub?.pointerId !== e.pointerId) return;
  const scale = viewboxScale(refs);
  const dxVb = (e.clientX - scrub.startX) / scale;
  const dyVb = (e.clientY - scrub.startY) / scale;
  if (!scrub.engaged) {
    if (Math.hypot(e.clientX - scrub.startX, e.clientY - scrub.startY) < SCRUB_THRESHOLD_PX) return;
    if (!engageScrub(refs, scrub, dxVb, dyVb)) {
      state.scrub = null;
      return;
    }
  }
  const t = clamp01((dxVb * scrub.dirX + dyVb * scrub.dirY) / scrub.length);
  const rate = dt > 0 ? ((t - scrub.t) * scrub.angle) / dt : 0;
  scrub.t = t;
  setVec(state.pos, slerp(scrub.from, scrub.to, t));
  setVec(state.omega, { x: scrub.axis.x * rate, y: scrub.axis.y * rate, z: scrub.axis.z * rate });
  ensureRunning(refs);
}

/** Release: past the midpoint the visitor arrives; before it, the sky
 *  returns them to where they stood. A cancelled pointer always
 *  returns. */
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
  state.scrubEndedAt = globalThis.performance.now();
  setVec(state.omega, { x: 0, y: 0, z: 0 });
  if (!cancelled && scrub.t >= SCRUB_COMMIT) {
    travelTo(refs, scrub.toPlace, scrub.alongEdgeId);
  } else {
    travelTo(refs, state.here);
  }
}

function handlePointerMove(refs: Refs, e: PointerEvent<SVGSVGElement>): void {
  const state = refs.stateRef.current;
  if (state.scrub) {
    const now = globalThis.performance.now();
    moveScrub(refs, e, state.lastTime === 0 ? 0 : (now - state.lastTime) / 1000);
    return;
  }
  if (prefersReducedMotion()) return;
  const bounds = e.currentTarget.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;
  // Inverted: moving toward an edge leans the camera the other way, so
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

/** The click a scrub ends with never reaches the stars. */
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
  const camera = orbitalCamera(start, REST_DISTANCE, 0);
  return {
    pos: { x: start.x, y: start.y, z: start.z },
    here,
    roll: 0,
    look: { x: 0, y: 0 },
    lookTarget: { x: 0, y: 0 },
    restDistance: REST_DISTANCE,
    restTarget: REST_DISTANCE,
    travel: null,
    scrub: null,
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
  here,
  namedKeys,
  onArrive,
  cameraRef,
  glyphRef,
}: UseSkyTravelArgs) {
  const stateRef = useRef<TravelState>(buildInitialState(graph, here));
  const graphRef = useRef(graph);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const namedRef = useRef(namedKeys);
  const onArriveRef = useRef(onArrive);
  const viewboxRef = useRef(viewboxSize);
  const fitRef = useRef(fit);
  const refsRef = useRef<Refs>({
    stateRef,
    graphRef,
    nodesRef,
    edgesRef,
    namedRef,
    onArriveRef,
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
    onArriveRef.current = onArrive;
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
