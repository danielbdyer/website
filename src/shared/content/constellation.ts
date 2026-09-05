import type { MetabolicState, Origin, Slice } from '@dbd/slice';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import {
  diskToHemisphere,
  geodesicDistance,
  spherical,
  sphericalToUnit,
} from '@/shared/geometry/sphere';
import { buildConcordance, type Concordance } from './concordance';
import { HUES, isHue, type ConstellationHue } from './hue';
import { SAMPLE_KIND } from './slice';
import { pickSliceSource } from './slices';

export { HUES, type ConstellationHue } from './hue';

// ─── The Constellation Graph ───────────────────────────────────────
//
// A slice of a graph as a sky. Each node becomes a star; each axis of
// the slice is a bearing of the compass, and the stars that carry an
// axis are joined into its figure; each relation the slice carries is
// a thread with an origin. The data layer is pure: it derives the sky
// from a slice (@dbd/slice) without knowing where the slice came from
// — the site's works, a vault of claims, an engine — and without
// knowing anything about rendering. CATHEDRALS.md §"The Contract".
//
// Deterministic per node: a star's place depends only on its own axes
// (and a jitter hashed from its key), so adding a node never moves
// another. CONSTELLATION_WALK.md §"The Compass" and §"What the Sky
// Draws at Rest" describe the visible result; this file is the data
// the renderer consumes.

/** One bearing of the compass: an axis of the slice, placed on the
 *  dome. The site's facets are one compass; a vault's topic maps are
 *  another. */
export interface Axis {
  readonly id: string;
  readonly name: string;
  readonly azimuthDeg: number;
  readonly hue: ConstellationHue;
  /** Within a hue's arc the alternate axes draw their figures in a
   *  dotted hairline — the way an atlas distinguishes two systems of
   *  lines in one ink — so figures that share a hue stay tellable
   *  apart. */
  readonly dotted: boolean;
  /** Where the axis's name is lettered: on its bearing, just outside
   *  the populated cap. */
  readonly rim: UnitVector3;
}

export interface ConstellationNode {
  /** The slice's id for the node: a work's `room/slug`, a claim's
   *  title. Every place in the walk is a key or the pole. */
  readonly key: string;
  readonly title: string;
  /** The kind of thing, worn lightly: a work's type, a claim's category. */
  readonly kind: string;
  /** The source's home for the node — a work's room — or null. */
  readonly group: string | null;
  /** Where the star opens, or null when the node has no page of its own. */
  readonly href: string | null;
  readonly summary: string | null;
  readonly date: Date;
  readonly axes: readonly string[];
  readonly status: MetabolicState | null;
  /** A sample stand-in (slice.ts, SAMPLE_KIND): drawn quieter, and
   *  named honestly to assistive output. */
  readonly isPreview: boolean;
  /** Polar coordinates within a unit circle: angleDeg ∈ [0, 360),
   *  radius ∈ [0, 1]. Center is the firmament's polestar; rim is
   *  the horizon. Deterministic in the node's own axes and key. */
  readonly angleDeg: number;
  readonly radius: number;
  /** Position on the latent unit sphere — the topology the camera
   *  travels. The 2D `(angleDeg, radius)` is the azimuthal-equidistant
   *  projection of this 3D position onto the upper hemisphere. */
  readonly unitPosition: UnitVector3;
  /** Hue of the node's first-listed axis, or 'gold' as a quiet default
   *  for a node with none. */
  readonly hue: ConstellationHue;
  /** Twinkle phase offset in seconds, deterministic per key, bounded by
   *  the twinkle duration in CSS (`star-twinkle` keyframes). */
  readonly twinklePhase: number;
}

/** A thread between two stars. A stroke of an axis's figure carries
 *  the axis and its hue and is emergent — structure the sky noticed. A
 *  relation the slice carries has no axis: it is declared or
 *  discovered, and its predicate is spoken by the whisper rather than
 *  drawn. CATHEDRALS.md §"Adjudications" 3. */
export interface ConstellationEdge {
  readonly source: string;
  readonly target: string;
  readonly axis: string | null;
  readonly hue: ConstellationHue | null;
  readonly origin: Origin;
  readonly predicate: string | null;
}

export interface ConstellationGraph {
  readonly axes: readonly Axis[];
  readonly nodes: readonly ConstellationNode[];
  readonly edges: readonly ConstellationEdge[];
  /** How near nodes are in their words (concordance.ts); feeds the
   *  sky's presence. Absent when a graph was built without texts. */
  readonly concordance?: Concordance;
}

/** A thread's stable id: `source|target|axis` for a figure's stroke,
 *  `source|target|predicate` for a relation. */
export function edgeId(edge: ConstellationEdge): string {
  return `${edge.source}|${edge.target}|${edge.axis ?? edge.predicate ?? edge.origin}`;
}

export function axisOf(graph: ConstellationGraph, id: string): Axis | null {
  return graph.axes.find((axis) => axis.id === id) ?? null;
}

// ─── The compass ───────────────────────────────────────────────────

/** Where each axis's name is lettered: on its bearing, just outside
 *  the populated cap, so the compass reads around the sky's edge. */
export const COMPASS_RIM_THETA = 1.152;

const rimOf = (azimuthDeg: number): UnitVector3 =>
  sphericalToUnit(spherical(COMPASS_RIM_THETA, (azimuthDeg * Math.PI) / 180));

/** The slice's axes as the compass: in bearing order, each with a hue
 *  — the source's, if it named one of the four, else assigned so that
 *  adjacent bearings share an arc — and the alternate axes of each arc
 *  dotted. Eight facets read as four chromatic arcs of two; a vault's
 *  thirteen maps read as four arcs of three or four. */
export function axesOf(axes: readonly Slice['axes'][number][]): readonly Axis[] {
  const ordered = axes.toSorted((a, b) => a.azimuthDeg - b.azimuthDeg || a.id.localeCompare(b.id));
  const slotOf = (i: number): number => Math.floor((i * HUES.length) / Math.max(ordered.length, 1));
  return ordered.map((axis, i) => {
    const slot = slotOf(i);
    const first = ordered.findIndex((_, j) => slotOf(j) === slot);
    return {
      id: axis.id,
      name: axis.name,
      azimuthDeg: axis.azimuthDeg,
      hue: isHue(axis.hue) ? axis.hue : (HUES[slot] ?? 'gold'),
      dotted: (i - first) % 2 === 1,
      rim: rimOf(axis.azimuthDeg),
    };
  });
}

// ─── Deterministic positioning ────────────────────────────────────
//
// A small string-hash producing a stable 32-bit integer. Used for the
// per-key jitter and twinkle phase. Crypto-strength is not needed; the
// only requirement is that the same input produces the same output
// across builds and platforms.

function hash(input: string): number {
  // FNV-1a (32-bit). Functional fold over the input's code points;
  // identical bit-for-bit to the imperative form.
  return (
    [...input].reduce(
      (h, ch) => Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16_777_619),
      2_166_136_261,
    ) >>> 0
  );
}

// 2^32 - 1, the maximum value `hash()` can return.
const UINT32_MAX = 2 ** 32 - 1;

function unitOffset(seed: string): number {
  // Maps a hash to [0, 1) deterministically.
  return hash(seed) / UINT32_MAX;
}

// Twinkle phase ceiling — the upper bound on each star's halo
// animation-delay. Matches the CSS `star-twinkle` keyframe duration
// in tokens.css so a phase value in [0, ceiling) puts each star at a
// random point in the cycle. If the CSS duration changes, this
// changes too — the value is paired, not free.
const TWINKLE_DURATION_SECONDS = 4.5;

// Each axis's anchor sits this far from the pole (as a fraction of the
// disk; radius × 90° = degrees from the pole, so ≈47°). A node on one
// axis lands on its anchor; a node on several at the centroid of their
// anchors, pulled inward. The bounds keep the polestar's center clear
// and hold the populated dome within the camera's resting view. A small
// deterministic jitter separates nodes that share an axis set exactly.
const AXIS_ANCHOR_RADIUS = 0.62;
// Nothing sits inside the polestar figure: the still center stays empty.
const RADIUS_MIN = 0.18;
export const RADIUS_MAX = 0.78;
const JITTER_RADIUS = 0.04;
const JITTER_AZIMUTH_DEG = 9;

/** The populated cap: how far from the pole the axes' anchors sit, and
 *  how far a star may be pushed. */
export interface Cap {
  readonly anchorRadius: number;
  readonly radiusMax: number;
}

export const DEFAULT_CAP: Cap = { anchorRadius: AXIS_ANCHOR_RADIUS, radiusMax: RADIUS_MAX };

// The cap grows with the count, so the sky never has to be resized by
// hand: each star needs a label's room (MIN_SEPARATION, below) at the
// overview, and when the default cap can no longer give it, the cap
// widens — at fixed spacing — as far as the equator. Beyond what the
// hemisphere holds, stars stand closer at the overview and the dial
// (sky/dial.ts) brings the visitor in. The site's works never reach the
// default cap's capacity, so their sky does not move.
const AREA_PER_STAR_SR = (Math.sqrt(3) / 2) * (0.095 * (Math.PI / 2)) ** 2;
const capSolidAngle = (radiusMax: number): number =>
  2 * Math.PI * (1 - Math.cos(radiusMax * (Math.PI / 2)));

/** The cap for a sky of `count` stars: the default up to its capacity,
 *  then widened at fixed spacing up to the equator. */
export function capFor(count: number): Cap {
  const needed = count * AREA_PER_STAR_SR;
  if (needed <= capSolidAngle(RADIUS_MAX)) return DEFAULT_CAP;
  const solidAngle = Math.min(needed, 2 * Math.PI);
  const radiusMax = Math.acos(1 - solidAngle / (2 * Math.PI)) / (Math.PI / 2);
  return { anchorRadius: radiusMax * (AXIS_ANCHOR_RADIUS / RADIUS_MAX), radiusMax };
}

export interface NodePlacement {
  readonly angleDeg: number;
  readonly radius: number;
  readonly unitPosition: UnitVector3;
}

/** Where a node sits: the centroid of its axes' anchors on the disk,
 *  jittered per key, un-projected onto the upper hemisphere. A node
 *  with no axes, or whose axes pull in every direction and cancel,
 *  rests near the pole with a hashed bearing — a true thing to say
 *  about it. Exported so the placement rule is testable without a
 *  corpus. */
export function placeNode(
  key: string,
  azimuthsDeg: readonly number[],
  cap: Cap = DEFAULT_CAP,
): NodePlacement {
  const centroid = azimuthsDeg.reduce(
    (acc, azimuthDeg) => {
      const az = (azimuthDeg * Math.PI) / 180;
      return {
        x: acc.x + (cap.anchorRadius * Math.cos(az)) / azimuthsDeg.length,
        y: acc.y + (cap.anchorRadius * Math.sin(az)) / azimuthsDeg.length,
      };
    },
    { x: 0, y: 0 },
  );
  const pull = Math.hypot(centroid.x, centroid.y);
  const jitterR = (unitOffset(`${key}/jitter-r`) - 0.5) * 2 * JITTER_RADIUS;
  const jitterA = (unitOffset(`${key}/jitter-a`) - 0.5) * 2 * JITTER_AZIMUTH_DEG;
  const baseAngleDeg =
    pull < 1e-9
      ? unitOffset(`${key}/angle`) * 360
      : (Math.atan2(centroid.y, centroid.x) * 180) / Math.PI;
  const radius = Math.min(Math.max(pull + jitterR, RADIUS_MIN), cap.radiusMax);
  const angleDeg = (((baseAngleDeg + jitterA) % 360) + 360) % 360;
  const unitPosition = diskToHemisphere(radius, (angleDeg * Math.PI) / 180);
  return { angleDeg, radius, unitPosition };
}

// Two nodes with the same axes land on the same centroid, and nodes
// whose axes face each other across the compass all pull toward the
// center. The spread keeps every star at least MIN_SEPARATION apart in
// the disk (about a label's height at rest) by nudging close pairs
// away from each other a few times — deterministic, so the sky is the
// same on every build. Placement stays honest: a star moves only as
// far as it must to be seen.
const MIN_SEPARATION = 0.095;
const SPREAD_ITERATIONS = 12;
// Coincident points have no direction between them; they part along a
// golden-angle fan keyed by index so the split is stable and even.
const GOLDEN_ANGLE_RAD = 2.399_963;

interface DiskPoint {
  readonly x: number;
  readonly y: number;
}

const toDisk = (p: NodePlacement): DiskPoint => ({
  x: p.radius * Math.cos((p.angleDeg * Math.PI) / 180),
  y: p.radius * Math.sin((p.angleDeg * Math.PI) / 180),
});

const clampDisk = (p: DiskPoint, radiusMax: number): DiskPoint => {
  const r = Math.hypot(p.x, p.y);
  const clamped = Math.min(Math.max(r, RADIUS_MIN), radiusMax);
  if (r < 1e-9) return { x: clamped, y: 0 };
  return { x: (p.x / r) * clamped, y: (p.y / r) * clamped };
};

function pushApart(points: readonly DiskPoint[], radiusMax: number): DiskPoint[] {
  return points.map((p, i) =>
    clampDisk(
      points.reduce((acc, q, j) => {
        if (i === j) return acc;
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d >= MIN_SEPARATION) return acc;
        const step = (MIN_SEPARATION - d) / 2;
        const ux = d > 1e-9 ? dx / d : Math.cos(i * GOLDEN_ANGLE_RAD);
        const uy = d > 1e-9 ? dy / d : Math.sin(i * GOLDEN_ANGLE_RAD);
        return { x: acc.x + ux * step, y: acc.y + uy * step };
      }, p),
      radiusMax,
    ),
  );
}

/** Separate placements that would sit on top of each other. Pure;
 *  order-preserving; idempotent once settled. */
export function spreadPlacements(
  placements: readonly NodePlacement[],
  radiusMax: number = RADIUS_MAX,
): NodePlacement[] {
  const settled = Array.from({ length: SPREAD_ITERATIONS }).reduce<DiskPoint[]>(
    (pts) => pushApart(pts, radiusMax),
    placements.map(toDisk),
  );
  return settled.map((p) => {
    const radius = Math.hypot(p.x, p.y);
    const angleDeg = ((((Math.atan2(p.y, p.x) * 180) / Math.PI) % 360) + 360) % 360;
    return { angleDeg, radius, unitPosition: diskToHemisphere(radius, (angleDeg * Math.PI) / 180) };
  });
}

// ─── Figures ───────────────────────────────────────────────────────
//
// Each axis's member stars are joined by the fewest strokes that
// connect them — a spanning tree over geodesic distance (Prim's method,
// grown from the first member in stable key order). The tree is the
// axis's figure: a few lines a visitor can recognize and remember, in
// place of the complete co-membership graph, which drew a line between
// every pair and said nothing. Derived relation shows as attention (the
// lit figure), never as a resting mesh. CONSTELLATION_WALK.md §"What the
// Sky Draws at Rest".

type Stroke = readonly [ConstellationNode, ConstellationNode];

interface Growing {
  readonly inTree: readonly ConstellationNode[];
  readonly outside: readonly ConstellationNode[];
  readonly strokes: readonly Stroke[];
}

/** The nearest (tree node, outside node) pair by geodesic distance —
 *  the next stroke Prim's method adds. Ties resolve to the earlier
 *  outside node in stable order, so the figure is deterministic. */
function nearestStroke(acc: Growing): { from: ConstellationNode; to: ConstellationNode } {
  return acc.outside.reduce(
    (best, candidate) => {
      const nearest = acc.inTree.reduce(
        (bt, t) => {
          const d = geodesicDistance(t.unitPosition, candidate.unitPosition);
          return d < bt.d ? { node: t, d } : bt;
        },
        { node: acc.inTree[0]!, d: Number.POSITIVE_INFINITY },
      );
      return nearest.d < best.d ? { from: nearest.node, to: candidate, d: nearest.d } : best;
    },
    { from: acc.inTree[0]!, to: acc.outside[0]!, d: Number.POSITIVE_INFINITY },
  );
}

/**
 * The spanning strokes of a figure over `members` (stable key order).
 *
 * @bigO Time: O(n³) in the axis's member count — n rounds, each
 *       scanning outside × tree. Runs once per axis at build time on
 *       a corpus of tens to hundreds, never on the hot path.
 */
function spanningStrokes(members: readonly ConstellationNode[]): readonly Stroke[] {
  if (members.length < 2) return [];
  const [first, ...rest] = members;
  const grown = rest.reduce<Growing>(
    (acc) => {
      const next = nearestStroke(acc);
      return {
        inTree: [...acc.inTree, next.to],
        outside: acc.outside.filter((n) => n !== next.to),
        strokes: [...acc.strokes, [next.from, next.to]],
      };
    },
    { inTree: [first!], outside: rest, strokes: [] },
  );
  return grown.strokes;
}

/** Every axis's figure as edges: emergent, in the axis's hue. Source
 *  and target are ordered by key so the same graph yields the same
 *  edge list every time. */
function deriveFigures(
  nodes: readonly ConstellationNode[],
  axes: readonly Axis[],
): readonly ConstellationEdge[] {
  return axes.flatMap((axis) => {
    const members = nodes
      .filter((node) => node.axes.includes(axis.id))
      .toSorted((a, b) => a.key.localeCompare(b.key));
    return spanningStrokes(members).map(([a, b]) => {
      const [source, target] = a.key <= b.key ? [a, b] : [b, a];
      return {
        source: source.key,
        target: target.key,
        axis: axis.id,
        hue: axis.hue,
        origin: 'emergent' as const,
        predicate: null,
      };
    });
  });
}

/** The relations the slice carries, as threads without an axis. */
const relationEdges = (slice: Slice): readonly ConstellationEdge[] =>
  slice.edges.map((edge) => ({
    source: edge.subject,
    target: edge.object,
    axis: null,
    hue: null,
    origin: edge.origin,
    predicate: edge.predicate,
  }));

// ─── From a slice ──────────────────────────────────────────────────

const nodeFrom = (
  node: Slice['nodes'][number],
  placement: NodePlacement,
  hueOf: ReadonlyMap<string, ConstellationHue>,
): ConstellationNode => {
  const first = node.axes[0];
  return {
    key: node.id,
    title: node.title,
    kind: node.kind,
    group: node.group ?? null,
    href: node.href ?? null,
    summary: node.summary ?? null,
    date: new Date(node.createdAt),
    axes: node.axes,
    status: node.status ?? null,
    isPreview: node.kind === SAMPLE_KIND,
    hue: (first === undefined ? undefined : hueOf.get(first)) ?? 'gold',
    twinklePhase: unitOffset(`${node.id}/twinkle`) * TWINKLE_DURATION_SECONDS,
    ...placement,
  };
};

/** The sky for a slice. `texts` lends the concordance the words a
 *  source has at hand (the works' bodies); without it the concordance
 *  reads titles and summaries, which is all a slice carries. */
export function graphFromSlice(
  slice: Slice,
  texts?: ReadonlyMap<string, string>,
): ConstellationGraph {
  const axes = axesOf(slice.axes);
  const azimuthOf = new Map(axes.map((axis) => [axis.id, axis.azimuthDeg]));
  const hueOf = new Map(axes.map((axis) => [axis.id, axis.hue]));
  const ordered = slice.nodes.toSorted((a, b) => a.id.localeCompare(b.id));
  const cap = capFor(ordered.length);
  const placements = spreadPlacements(
    ordered.map((node) =>
      placeNode(
        node.id,
        node.axes.flatMap((id) => {
          const azimuth = azimuthOf.get(id);
          return azimuth === undefined ? [] : [azimuth];
        }),
        cap,
      ),
    ),
    cap.radiusMax,
  );
  const nodes = ordered.map((node, i) =>
    nodeFrom(node, placements[i] ?? placeNode(node.id, [], cap), hueOf),
  );
  const edges = [...deriveFigures(nodes, axes), ...relationEdges(slice)].toSorted((a, b) =>
    edgeId(a).localeCompare(edgeId(b)),
  );
  const concordance = buildConcordance(
    nodes.map((node) => ({
      key: node.key,
      text: texts?.get(node.key) ?? `${node.title} ${node.summary ?? ''}`,
    })),
  );
  return { axes, nodes, edges, concordance };
}

// ─── Public API ────────────────────────────────────────────────────

/** The sky the build chose (slices.ts): the site's works unless the
 *  build named another slice. */
export function getConstellationGraphSync(): ConstellationGraph {
  const source = pickSliceSource();
  return graphFromSlice(source.slice, source.texts);
}

// Async barrel signature, mirroring the rest of the content API
// (see src/shared/content/index.ts §"Isomorphic content API"). Route
// loaders await this; if the implementation ever moves behind a
// fetched JSON manifest, the route surface does not change.
export function getConstellationGraph(): Promise<ConstellationGraph> {
  return Promise.resolve(getConstellationGraphSync());
}
