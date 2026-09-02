import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { applyCameraLook, cameraBasis } from '@/shared/geometry/camera';
import { heavensPhase } from '@/shared/geometry/heavens';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { geodesicDistance, slerp } from '@/shared/geometry/sphere';
import { tangentHoldDirection, type NavigableNode } from '@/shared/geometry/wellPhysics';
import {
  TRAIL_LENGTH,
  broadcastCameraToFirmament,
  broadcastCursorToFirmament,
  projectGlyph,
  projectPole,
  projectStars,
  projectThreads,
  projectTrail,
  writeGlyphChannels,
  type NavigableEdge,
} from '@/shared/dom/skyProjector';
import type { ConstellationGraph } from '@/shared/content/constellation';
import {
  POLE_KEY,
  REST_DISTANCE,
  findNode,
  neighborToward,
  placePosition,
  type Place,
} from '@/shared/content/skyWalk';
import { readPersistedHere } from '@/shared/state/hereStorage';

// Destination travel across the constellation's latent sphere.
//
// The visitor is always somewhere — *here*, a star or the pole — and
// the camera rests there, pulled back far enough that the populated
// dome is in view at once. Travel begins only when a destination is
// named (a star, a bearing, a thread, an arrow key) and moves the
// camera's surface point along the great circle from here to there in
// a held second, dollying in toward the surface mid-crossing so the
// stars beside the path stream past faster than the destination
// approaches: velocity read as depth. Arrival reports the new *here*
// to the organism, which draws the names and the whisper. Nothing
// pulls, drifts, coasts, or demonstrates on its own.
// CONSTELLATION_WALK.md §"Travel".
//
// The heavens' roll rides the wall clock (heavens.ts); the loop keeps a
// ten-frames-a-second idle cadence to carry it while the sky rests,
// and runs at full rate only while traveling or while the mouse-look
// peer eases. Reduced motion never runs the loop: travel is an instant
// arrival and the scene projects once.

interface UseSkyTravelArgs {
  readonly graph: ConstellationGraph;
  readonly nodes: readonly NavigableNode[];
  readonly edges: readonly NavigableEdge[];
  readonly viewboxSize: number;
  readonly here: Place;
  /** Called when travel completes (or immediately under reduced
   *  motion) with the place arrived at and the edge traveled along,
   *  if the travel followed a thread. */
  readonly onArrive: (place: Place, alongEdgeId?: string) => void;
  readonly cameraRef: RefObject<SVGGElement | null>;
  readonly glyphRef: RefObject<SVGCircleElement | null>;
}

// The resting camera (REST_DISTANCE, skyWalk.ts) sits far enough back
// that the populated dome is in view; mid-travel it dips toward the
// surface — the trench.
const ORBIT_NEAR = 1.55;
// Travel duration scales with the distance: a neighbor is a held
// second, the far side of the dome two (the Held register).
const TRAVEL_MIN_MS = 900;
const TRAVEL_MAX_MS = 2000;
const TRAVEL_FULL_ANGLE_RAD = 1.2;
const CAMERA_FOV_Y = Math.PI / 4;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 10;
const WORLD_UP: UnitVector3 = { x: 0, y: 1, z: 0 };
// The passive mouse-look peer — a degree or two of true perspective
// toward the cursor, easing in and out, so the space breathes with
// attention without committing anywhere.
const MAX_LOOK_RAD = 0.07;
const LOOK_EASE_RATE = 5;
const LOOK_REST_EPSILON = 0.002;
const IDLE_TICK_MS = 100;
const MAX_DT_SECONDS = 0.1;

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

interface TravelState {
  /** The camera's surface point — where the visitor is, on the sphere. */
  pos: MutableVec3;
  here: Place;
  roll: number;
  look: { x: number; y: number };
  lookTarget: { x: number; y: number };
  travel: Travel | null;
  currentCamera: Camera;
  currentBasis: CameraBasis;
  trailHistory: MutableVec3[];
  lastTime: number;
  lastSpeed: number;
  raf: number | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

/** Everything the loop reads, gathered once so the effects and
 *  handlers close over one stable object rather than the latest
 *  props. The prop-shaped refs are refreshed after every render. */
interface Refs {
  readonly stateRef: RefObject<TravelState>;
  readonly graphRef: RefObject<ConstellationGraph>;
  readonly nodesRef: RefObject<readonly NavigableNode[]>;
  readonly edgesRef: RefObject<readonly NavigableEdge[]>;
  readonly onArriveRef: RefObject<UseSkyTravelArgs['onArrive']>;
  readonly viewboxRef: RefObject<number>;
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

/** Smooth in and out — the trench accelerates and then arrives. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1);
}

function setVec(target: MutableVec3, v: UnitVector3): void {
  target.x = v.x;
  target.y = v.y;
  target.z = v.z;
}

function projectScene(state: TravelState, refs: Refs): void {
  const cameraGroup = refs.cameraRef.current;
  if (!cameraGroup) return;
  const { currentCamera: camera, currentBasis: basis } = state;
  const size = refs.viewboxRef.current;
  projectPole(cameraGroup, camera, basis, size);
  projectStars(cameraGroup, refs.nodesRef.current, camera, basis, size);
  projectThreads(cameraGroup, refs.edgesRef.current, camera, basis, size);
  const cursorProj = projectGlyph(refs.glyphRef.current, state.pos, camera, basis, size);
  projectTrail(cameraGroup, state.trailHistory, camera, basis, size);
  broadcastCursorToFirmament(cursorProj, size);
  broadcastCameraToFirmament(camera, basis);
}

/** Rebuild the camera for the current surface point, dolly, look, and
 *  roll, then project. */
function placeCamera(state: TravelState, refs: Refs, distance: number): void {
  state.currentCamera = applyCameraLook(
    orbitalCamera(state.pos, distance, state.roll),
    state.look.x * MAX_LOOK_RAD,
    state.look.y * MAX_LOOK_RAD,
  );
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

/** Advance an in-flight travel: ease the surface point along the great
 *  circle, dolly the camera in and back out, and on completion settle
 *  exactly on the destination and report the arrival. Returns the
 *  camera distance for this frame. */
function advanceTravel(state: TravelState, refs: Refs, now: number, dt: number): number {
  const travel = state.travel;
  if (!travel) return REST_DISTANCE;
  const t = clamp01((now - travel.startTime) / travel.durationMs);
  const eased = easeInOutCubic(t);
  const before = { x: state.pos.x, y: state.pos.y, z: state.pos.z };
  setVec(state.pos, slerp(travel.from, travel.to, eased));
  state.lastSpeed = dt > 0 ? geodesicDistance(before, state.pos) / dt : 0;
  if (t >= 1) {
    setVec(state.pos, travel.to);
    state.travel = null;
    state.here = travel.toPlace;
    state.lastSpeed = 0;
    refs.onArriveRef.current?.(travel.toPlace, travel.alongEdgeId);
    return REST_DISTANCE;
  }
  return REST_DISTANCE - (REST_DISTANCE - ORBIT_NEAR) * Math.sin(Math.PI * t);
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
  state.roll = prefersReducedMotion() ? 0 : heavensPhase(Date.now());
  const distance = advanceTravel(state, refs, now, dt);
  shiftTrail(state);
  const lookT = 1 - Math.exp(-LOOK_EASE_RATE * dt);
  state.look.x += (state.lookTarget.x - state.look.x) * lookT;
  state.look.y += (state.lookTarget.y - state.look.y) * lookT;
  placeCamera(state, refs, distance);
  // The glyph claims fully when standing on a star; the trail asserts
  // itself only while traveling.
  writeGlyphChannels(refs.glyphRef.current, state.travel ? 0 : 1, state.lastSpeed);
  const lookSettled =
    Math.abs(state.look.x - state.lookTarget.x) < LOOK_REST_EPSILON &&
    Math.abs(state.look.y - state.lookTarget.y) < LOOK_REST_EPSILON;
  scheduleNext(state, refs, state.travel === null && lookSettled);
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
    placeCamera(state, refs, REST_DISTANCE);
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

function handlePointerMove(refs: Refs, e: PointerEvent<SVGSVGElement>): void {
  if (prefersReducedMotion()) return;
  const state = refs.stateRef.current;
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

/** Mount: project the sky from where the visitor stands and start the
 *  loop (reduced motion projects once). Then the session's remembered
 *  place: prerendered markup cannot know it, so the sky opens at the
 *  pole and carries the visitor back to where they stood
 *  (CONSTELLATION_WALK.md §"The Walk's Memory"). A look-up jump — a
 *  non-pole `here` — wins over the memory. */
function mount(refs: Refs): () => void {
  const state = refs.stateRef.current;
  if (prefersReducedMotion()) {
    placeCamera(state, refs, REST_DISTANCE);
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
    travel: null,
    currentCamera: camera,
    currentBasis: cameraBasis(camera),
    trailHistory: Array.from({ length: TRAIL_LENGTH }, () => ({ ...start })),
    lastTime: 0,
    lastSpeed: 0,
    raf: null,
    idleTimer: null,
  };
}

export function useSkyTravel({
  graph,
  nodes,
  edges,
  viewboxSize,
  here,
  onArrive,
  cameraRef,
  glyphRef,
}: UseSkyTravelArgs) {
  const stateRef = useRef<TravelState>(buildInitialState(graph, here));
  const graphRef = useRef(graph);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const onArriveRef = useRef(onArrive);
  const viewboxRef = useRef(viewboxSize);
  const refsRef = useRef<Refs>({
    stateRef,
    graphRef,
    nodesRef,
    edgesRef,
    onArriveRef,
    viewboxRef,
    cameraRef,
    glyphRef,
  });
  useEffect(() => {
    graphRef.current = graph;
    nodesRef.current = nodes;
    edgesRef.current = edges;
    onArriveRef.current = onArrive;
    viewboxRef.current = viewboxSize;
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
    pointerHandlers: {
      onPointerMove: (e: PointerEvent<SVGSVGElement>) => handlePointerMove(refsRef.current, e),
      onPointerLeave: () => handlePointerLeave(refsRef.current),
    },
  };
}
