import type { KeyboardEvent, MouseEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { UnitVector3 } from '@/shared/geometry/sphere';
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
  projectTrail,
  writeGlyphChannels,
  type NavigableEdge,
} from '@/shared/dom/skyProjector';
import { fitViewboxToCanvas } from '@/shared/webgl/atmosphereProjection';
import type { ConstellationGraph } from '@/shared/content/constellation';
import {
  POLE_KEY,
  findNode,
  neighborToward,
  placePosition,
  restDistanceFor,
  type Place,
} from '@/shared/content/skyWalk';
import { readPersistedHere } from '@/shared/state/hereStorage';
import type { SkyWalk } from '@/shared/hooks/useSkyWalk';
import {
  advance,
  cameraOf,
  fitRest,
  initialMotion,
  isHeld,
  isStill,
  lookToward,
  travelTo,
  type Motion,
  type MotionEvent,
} from '@/shared/sky/motion';
import { grab, handOf, moveHand, releaseHand } from '@/shared/sky/hand';
import { walkDistanceFor } from '@/shared/sky/dial';

// The shell around the sky's pure motion (sky/motion.ts, sky/hand.ts).
//
// This hook owns exactly what cannot be pure: the reference to the
// current motion, the animation-frame schedule and the clock, the
// pointer capture, the per-frame paint through the projector, and the
// dispatch of events (arrived, aimed) to the walk. Every transition it
// performs is a call into the pure core: a motion in, a motion out. The
// core never sees the DOM; the shell never decides anything.
// CONSTELLATION_ARCHITECTURE.md §"The shell".

interface UseSkyTravelArgs {
  readonly graph: ConstellationGraph;
  readonly nodes: readonly NavigableNode[];
  readonly edges: readonly NavigableEdge[];
  readonly viewboxSize: number;
  /** The SVG's fit inside its frame (mirrors preserveAspectRatio). */
  readonly fit: 'cover' | 'contain';
  /** The walk's state: travel follows a change of `here`; arrivals and
   *  aims are dispatched to it. */
  readonly walk: SkyWalk;
  /** The labels visible at rest, in priority order (here first). */
  readonly namedKeys: readonly string[];
  readonly cameraRef: RefObject<SVGGElement | null>;
  readonly glyphRef: RefObject<SVGCircleElement | null>;
}

const IDLE_TICK_MS = 100;
/** The click a drag ends with is not a click. */
const CLICK_SUPPRESS_MS = 400;
/** Labels are laid out on arrival and at this cadence at rest. */
const LABEL_INTERVAL_MS = 1500;

/** The shell's own mutable corner: the motion, the paint's trail and
 *  marks, the schedule. Everything else is a value from the core. */
interface Shell {
  motion: Motion;
  /** The dial's two rests for the current frame: the overview, where
   *  the whole ball fits the oculus, and the walk, where about
   *  VIEW_TARGET stars are in view (sky/dial.ts). */
  overview: number;
  walk: number;
  trail: readonly UnitVector3[];
  trackMark: string | null;
  scrubbing: boolean;
  labelsAt: number;
  raf: number | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
  resize: ResizeObserver | null;
}

interface Refs {
  readonly shell: RefObject<Shell>;
  readonly graph: RefObject<ConstellationGraph>;
  readonly nodes: RefObject<readonly NavigableNode[]>;
  readonly edges: RefObject<readonly NavigableEdge[]>;
  readonly named: RefObject<readonly string[]>;
  readonly walk: RefObject<SkyWalk>;
  readonly viewbox: RefObject<number>;
  readonly fit: RefObject<'cover' | 'contain'>;
  readonly cameraGroup: RefObject<SVGGElement | null>;
  readonly glyph: RefObject<SVGCircleElement | null>;
}

function prefersReducedMotion(): boolean {
  return (
    globalThis.window !== undefined &&
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

const now = (): number => globalThis.performance.now();

function svgOf(refs: Refs): SVGSVGElement | null {
  return refs.cameraGroup.current?.ownerSVGElement ?? null;
}

// ─── Painting ──────────────────────────────────────────────────────

/** Write one motion to the page: the camera through the projector, the
 *  companion and its trail, the camera and streak to the atmosphere,
 *  and the marks a held sky carries. */
function paint(refs: Refs, motion: Motion): void {
  const shell = refs.shell.current;
  const cameraGroup = refs.cameraGroup.current;
  if (!cameraGroup) return;
  const { camera, basis } = cameraOf(motion);
  const size = refs.viewbox.current;
  projectPole(cameraGroup, camera, basis, size);
  projectDaystar(cameraGroup.ownerSVGElement, size, refs.fit.current);
  projectCompass(cameraGroup, refs.graph.current.axes, camera, basis, size);
  projectStars(cameraGroup, refs.nodes.current, camera, basis, size);
  projectThreads(cameraGroup, refs.edges.current, camera, basis, size);
  const cursor = projectGlyph(refs.glyph.current, motion.pos, camera, basis, size);
  shell.trail = [motion.pos, ...shell.trail.slice(0, TRAIL_LENGTH - 1)];
  projectTrail(cameraGroup, shell.trail, camera, basis, size);
  broadcastCursorToFirmament(cursor, size);
  broadcastCameraToFirmament(camera, basis, motion.omega);
  const hand = handOf(motion);
  const aimed = hand?.intent !== null && hand?.intent !== undefined;
  writeGlyphChannels(refs.glyph.current, isHeld(motion) && !aimed ? 0 : 1, motion.speed);
  paintMarks(refs, motion);
}

/** The lit track and the scrubbing cursor follow the hand's phase; the
 *  attributes are written only when they change. */
function paintMarks(refs: Refs, motion: Motion): void {
  const shell = refs.shell.current;
  const hand = handOf(motion);
  const track = hand?.engaged ? (hand.track?.alongEdgeId ?? null) : null;
  const scrubbing = hand?.engaged === true;
  const cameraGroup = refs.cameraGroup.current;
  if (cameraGroup && track !== shell.trackMark) {
    markTrack(cameraGroup, track);
    shell.trackMark = track;
  }
  const svg = svgOf(refs);
  if (svg && scrubbing !== shell.scrubbing) {
    svg.dataset.scrubbing = scrubbing ? 'true' : 'false';
    shell.scrubbing = scrubbing;
  }
}

/** Lay the labels out when the sky is still — on arrival (labelsAt is
 *  zeroed) and at the idle cadence. */
function maybePlaceLabels(refs: Refs, motion: Motion, at: number): void {
  const shell = refs.shell.current;
  if (isHeld(motion) || motion.phase.kind !== 'rest') return;
  if (at - shell.labelsAt < LABEL_INTERVAL_MS) return;
  const cameraGroup = refs.cameraGroup.current;
  if (!cameraGroup) return;
  const { camera, basis } = cameraOf(motion);
  placeLabels(
    cameraGroup,
    refs.named.current,
    refs.nodes.current,
    camera,
    basis,
    refs.viewbox.current,
  );
  shell.labelsAt = at;
}

// ─── Events and the loop ───────────────────────────────────────────

/** Hand the core's events to the walk. */
function dispatch(refs: Refs, events: readonly MotionEvent[]): void {
  const walk = refs.walk.current;
  for (const event of events) {
    if (event.kind === 'arrived') {
      refs.shell.current.labelsAt = 0;
      walk.arrive(event.place, event.alongEdgeId);
    } else {
      walk.aim(event.place);
    }
  }
}

/** Take a step of the core and make it visible. */
function commit(refs: Refs, next: { motion: Motion; events: readonly MotionEvent[] }): void {
  refs.shell.current.motion = next.motion;
  paint(refs, next.motion);
  dispatch(refs, next.events);
}

function scheduleNext(refs: Refs, resting: boolean): void {
  const shell = refs.shell.current;
  if (!resting) {
    shell.raf = globalThis.requestAnimationFrame((t) => tick(refs, t));
    return;
  }
  // At rest the loop doesn't stop — the weather still turns — but
  // drops to the idle cadence until input wakes it.
  shell.raf = null;
  shell.idleTimer = setTimeout(() => {
    shell.idleTimer = null;
    shell.raf = globalThis.requestAnimationFrame((t) => tick(refs, t));
  }, IDLE_TICK_MS);
}

function tick(refs: Refs, at: number): void {
  const shell = refs.shell.current;
  commit(refs, advance(shell.motion, at));
  maybePlaceLabels(refs, shell.motion, at);
  scheduleNext(refs, isStill(shell.motion));
}

function ensureRunning(refs: Refs): void {
  const shell = refs.shell.current;
  if (shell.raf !== null) return;
  if (shell.idleTimer !== null) {
    clearTimeout(shell.idleTimer);
    shell.idleTimer = null;
  }
  shell.motion = { ...shell.motion, time: 0 };
  shell.raf = globalThis.requestAnimationFrame((t) => tick(refs, t));
}

function stopLoop(shell: Shell): void {
  if (shell.raf !== null) globalThis.cancelAnimationFrame(shell.raf);
  shell.raf = null;
  if (shell.idleTimer !== null) clearTimeout(shell.idleTimer);
  shell.idleTimer = null;
  shell.resize?.disconnect();
  shell.resize = null;
}

// ─── Requests from the organism ────────────────────────────────────

/** Where the sky rests for a place: the pole at the overview, a star
 *  at the walk. The only dolly is between the two. */
function restFor(shell: Shell, place: Place): number {
  return place === POLE_KEY ? shell.overview : shell.walk;
}

function beginTravel(refs: Refs, place: Place, alongEdgeId?: string): void {
  const shell = refs.shell.current;
  const to = placePosition(refs.graph.current, place);
  const reduced = prefersReducedMotion();
  const next = travelTo(shell.motion, to, place, now(), alongEdgeId, reduced);
  commit(refs, { ...next, motion: fitRest(next.motion, restFor(shell, place), reduced) });
  if (reduced) {
    shell.labelsAt = 0;
    maybePlaceLabels(refs, shell.motion, now());
  } else {
    ensureRunning(refs);
  }
}

function handleKeyDown(refs: Refs, e: KeyboardEvent): void {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const { motion } = refs.shell.current;
  const { basis } = cameraOf(motion);
  const direction = tangentHoldDirection(new Set([e.key]), basis, motion.pos);
  const next = neighborToward(refs.graph.current, motion.here, direction);
  if (!next) return;
  e.preventDefault();
  beginTravel(refs, next);
}

// ─── The hand ──────────────────────────────────────────────────────

/** CSS pixels per viewbox unit for the SVG's current fit. */
function viewportOf(refs: Refs): { size: number; scale: number } {
  const size = refs.viewbox.current;
  const svg = svgOf(refs);
  const rect = svg?.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) return { size, scale: 1 };
  return { size, scale: fitViewboxToCanvas(rect.width, rect.height, size, refs.fit.current).scale };
}

function handlePointerDown(refs: Refs, e: PointerEvent<SVGSVGElement>): void {
  if (e.button !== 0 || !e.isPrimary) return;
  const shell = refs.shell.current;
  // Mid-flight the sky is not to be taken hold of; it is going somewhere.
  if (shell.motion.phase.kind === 'travel') return;
  // A press on the open sky selects nothing and focuses nothing; a press
  // on a star keeps the star's own behavior until the hand moves.
  if (!(e.target as Element).closest('a')) e.preventDefault();
  shell.motion = grab(shell.motion, { id: e.pointerId, x: e.clientX, y: e.clientY }, now());
}

function handlePointerMove(refs: Refs, e: PointerEvent<SVGSVGElement>): void {
  const shell = refs.shell.current;
  const before = handOf(shell.motion);
  if (before) {
    const pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
    const next = moveHand(shell.motion, pointer, refs.graph.current, viewportOf(refs), now());
    const after = handOf(next.motion);
    // Capture only once the hand has moved: a capture at the press would
    // retarget the click, and a tap on a star must stay the star's.
    if (after?.engaged && !before.engaged) e.currentTarget.setPointerCapture(e.pointerId);
    commit(refs, next);
    ensureRunning(refs);
    return;
  }
  if (prefersReducedMotion()) return;
  const bounds = e.currentTarget.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;
  // Inverted: moving toward an edge leans the sky the other way, so
  // the gesture reads as "head toward what I'm reaching for."
  const x = -(((e.clientX - bounds.left) / bounds.width) * 2 - 1);
  const y = ((e.clientY - bounds.top) / bounds.height) * 2 - 1;
  shell.motion = lookToward(shell.motion, x, y);
  ensureRunning(refs);
}

function handlePointerEnd(refs: Refs, e: PointerEvent<SVGSVGElement>, cancelled: boolean): void {
  const shell = refs.shell.current;
  if (!handOf(shell.motion)) return;
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
  commit(refs, releaseHand(shell.motion, e.pointerId, refs.graph.current, cancelled, now()));
  ensureRunning(refs);
}

function handlePointerLeave(refs: Refs): void {
  const shell = refs.shell.current;
  shell.motion = lookToward(shell.motion, 0, 0);
  if (!prefersReducedMotion()) ensureRunning(refs);
}

/** The click a drag ends with never reaches the stars. */
function handleClickCapture(refs: Refs, e: MouseEvent<SVGSVGElement>): void {
  if (now() - refs.shell.current.motion.releasedAt < CLICK_SUPPRESS_MS) {
    e.preventDefault();
    e.stopPropagation();
  }
}

// ─── The frame and the mount ───────────────────────────────────────

/** Fit the resting camera to the frame now and whenever it changes
 *  shape. */
/** Fit the dial to a frame: the overview from the frame's aspect, the
 *  walk from the graph's density at that overview. */
function fitDial(refs: Refs, width: number, height: number): void {
  const shell = refs.shell.current;
  shell.overview = restDistanceFor(width, height, refs.fit.current);
  shell.walk = walkDistanceFor(refs.graph.current, shell.overview, { width, height });
}

/** The place the sky is resting at or traveling to. */
function destinationOf(motion: Motion): Place {
  return motion.phase.kind === 'travel' ? motion.phase.travel.toPlace : motion.here;
}

function watchFrame(refs: Refs): void {
  const shell = refs.shell.current;
  const svg = svgOf(refs);
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  fitDial(refs, rect.width, rect.height);
  shell.motion = fitRest(shell.motion, restFor(shell, destinationOf(shell.motion)), true);
  if (typeof ResizeObserver === 'undefined') return;
  shell.resize = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect;
    if (!box) return;
    const reduced = prefersReducedMotion();
    fitDial(refs, box.width, box.height);
    shell.motion = fitRest(shell.motion, restFor(shell, destinationOf(shell.motion)), reduced);
    if (reduced) paint(refs, shell.motion);
    else ensureRunning(refs);
  });
  shell.resize.observe(svg);
}

/** Mount: fit the camera to the frame, paint the sky from where the
 *  visitor stands, and start the loop (reduced motion paints once).
 *  Then the session's remembered place: prerendered markup cannot know
 *  it, so the sky opens at the pole and carries the visitor back to
 *  where they stood (CONSTELLATION_WALK.md §"The Walk's Memory"). A
 *  look-up jump — a non-pole `here` — wins over the memory. */
function mount(refs: Refs): () => void {
  const shell = refs.shell.current;
  watchFrame(refs);
  if (prefersReducedMotion()) {
    paint(refs, shell.motion);
    maybePlaceLabels(refs, shell.motion, now());
  } else {
    ensureRunning(refs);
  }
  const remembered = shell.motion.here === POLE_KEY ? readPersistedHere() : null;
  if (remembered && remembered !== POLE_KEY && findNode(refs.graph.current, remembered)) {
    beginTravel(refs, remembered);
  }
  return () => stopLoop(shell);
}

function initialShell(graph: ConstellationGraph, here: Place): Shell {
  const at = placePosition(graph, here);
  const motion = initialMotion(here, at);
  return {
    motion,
    overview: motion.rest,
    walk: motion.rest,
    trail: Array.from({ length: TRAIL_LENGTH }, () => at),
    trackMark: null,
    scrubbing: false,
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
  const shell = useRef<Shell>(initialShell(graph, walk.here));
  const graphRef = useRef(graph);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const namedRef = useRef(namedKeys);
  const walkRef = useRef(walk);
  const viewboxRef = useRef(viewboxSize);
  const fitRef = useRef(fit);
  const refsRef = useRef<Refs>({
    shell,
    graph: graphRef,
    nodes: nodesRef,
    edges: edgesRef,
    named: namedRef,
    walk: walkRef,
    viewbox: viewboxRef,
    fit: fitRef,
    cameraGroup: cameraRef,
    glyph: glyphRef,
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
  const here = walk.here;
  useEffect(() => {
    const refs = refsRef.current;
    const { motion } = refs.shell.current;
    const heading = motion.phase.kind === 'travel' ? motion.phase.travel.toPlace : null;
    if (motion.here === here || heading === here) return;
    beginTravel(refs, here);
  }, [here]);

  return {
    travelTo: (place: Place, alongEdgeId?: string) =>
      beginTravel(refsRef.current, place, alongEdgeId),
    onKeyDown: (e: KeyboardEvent) => handleKeyDown(refsRef.current, e),
    beginScrub: (e: PointerEvent<SVGSVGElement>) => handlePointerDown(refsRef.current, e),
    pointerHandlers: {
      onPointerMove: (e: PointerEvent<SVGSVGElement>) => handlePointerMove(refsRef.current, e),
      onPointerUp: (e: PointerEvent<SVGSVGElement>) => handlePointerEnd(refsRef.current, e, false),
      onPointerCancel: (e: PointerEvent<SVGSVGElement>) =>
        handlePointerEnd(refsRef.current, e, true),
      onPointerLeave: () => handlePointerLeave(refsRef.current),
      onClickCapture: (e: MouseEvent<SVGSVGElement>) => handleClickCapture(refsRef.current, e),
    },
  };
}
