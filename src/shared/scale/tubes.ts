// The straws. A straw bends; it never stretches or melts.
//
// Every character in the bestiary is a knot tied in its own velocity:
// the seven tubes that express the motion are the same tubes that
// bend into the thing that moves. So a tube is held two ways — as the
// points it is drawn through (head to tail), and as the bends it is
// morphed through: where it starts, which way each segment turns, how
// long each is. Morphing in bends keeps every segment its length and
// reads as a straw bending; morphing in points would shrink a tube
// through a collapsed average and read as melting. Pure: nothing here
// touches a canvas or a clock. OBJECTS_OF_SCALE.md §"The morph".

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** A tube as it is authored and drawn: its centerline, head first. */
export interface Tube {
  readonly points: readonly Vec2[];
  readonly radius: number;
  /** Draw order: a smaller z is drawn first, behind. */
  readonly z: number;
}

/** A tube as it is morphed: the start, then each segment's heading
 *  and length. `angles` and `lengths` are one shorter than the
 *  points they integrate to. */
export interface Bends {
  readonly start: Vec2;
  readonly angles: readonly number[];
  readonly lengths: readonly number[];
}

/** Every pose is resampled to this many evenly spaced points, so a
 *  morph between two poses pairs segment with segment. */
export const SAMPLES = 48;

const TAU = Math.PI * 2;

// ─── Small algebra ─────────────────────────────────────────────────

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpVec = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});
export const distance = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.y - a.y);
export const polar = (angle: number, length: number): Vec2 => ({
  x: Math.cos(angle) * length,
  y: Math.sin(angle) * length,
});

/** The shortest signed turn from heading `a` to heading `b`, in
 *  (−π, π]. Interpolating along it is the circle's own slerp. */
export function turn(a: number, b: number): number {
  const raw = (b - a) % TAU;
  const wrapped = raw > Math.PI ? raw - TAU : raw;
  return wrapped <= -Math.PI ? wrapped + TAU : wrapped;
}

export const smoothstep = (t: number): number => {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
};

/** The running values of a fold: every intermediate accumulator,
 *  seed first. What integrating a list of steps needs. */
export function scan<A, B>(xs: readonly A[], seed: B, step: (acc: B, x: A) => B): B[] {
  return xs.reduce<B[]>((acc, x) => [...acc, step(acc.at(-1) ?? seed, x)], [seed]);
}

const pairs = <T>(xs: readonly T[]): (readonly [T, T])[] =>
  xs.slice(1).map((b, i) => [xs[i] as T, b] as const);

// ─── Between the two holdings ──────────────────────────────────────

export function bendsOf(points: readonly Vec2[]): Bends {
  const segments = pairs(points);
  return {
    start: points[0] ?? { x: 0, y: 0 },
    angles: segments.map(([a, b]) => Math.atan2(b.y - a.y, b.x - a.x)),
    lengths: segments.map(([a, b]) => distance(a, b)),
  };
}

/** Integrate the bends back to points: walk from the start, one
 *  segment at a time. */
export function pointsOf(bends: Bends): Vec2[] {
  const steps = bends.angles.map((angle, i) => polar(angle, bends.lengths[i] ?? 0));
  return scan(steps, bends.start, add);
}

export const lengthOf = (points: readonly Vec2[]): number =>
  pairs(points).reduce((sum, [a, b]) => sum + distance(a, b), 0);

// ─── Shaping a pose ────────────────────────────────────────────────

/** Centripetal Catmull-Rom through the control points, `per` samples
 *  a span. Centripetal parameterization avoids the loops and cusps a
 *  uniform spline makes at a sharp elbow. Ends are clamped by
 *  repeating the first and last control point. */
export function smooth(control: readonly Vec2[], per: number): Vec2[] {
  if (control.length < 2) return [...control];
  const first = control[0]!;
  const last = control.at(-1)!;
  const padded = [first, ...control, last];
  const spans = Array.from({ length: control.length - 1 }, (_, i) => i);
  const inner = spans.flatMap((i) =>
    Array.from({ length: per }, (_, k) =>
      catmullRom(padded[i]!, padded[i + 1]!, padded[i + 2]!, padded[i + 3]!, k / per),
    ),
  );
  return [...inner, last];
}

/** One centripetal Catmull-Rom sample between p1 and p2. */
function catmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const knot = (a: Vec2, b: Vec2, prev: number): number =>
    prev + Math.max(Math.sqrt(distance(a, b)), 1e-4);
  const t0 = 0;
  const t1 = knot(p0, p1, t0);
  const t2 = knot(p1, p2, t1);
  const t3 = knot(p2, p3, t2);
  const u = lerp(t1, t2, t);
  const between = (a: Vec2, b: Vec2, ta: number, tb: number): Vec2 =>
    lerpVec(a, b, (u - ta) / (tb - ta));
  const a1 = between(p0, p1, t0, t1);
  const a2 = between(p1, p2, t1, t2);
  const a3 = between(p2, p3, t2, t3);
  const b1 = between(a1, a2, t0, t2);
  const b2 = between(a2, a3, t1, t3);
  return between(b1, b2, t1, t2);
}

/** `n` points evenly spaced along the polyline by arc length. */
export function resample(points: readonly Vec2[], n: number): Vec2[] {
  if (points.length < 2) return Array.from({ length: n }, () => points[0] ?? { x: 0, y: 0 });
  const along = scan(pairs(points), 0, (s, [a, b]) => s + distance(a, b));
  const total = along.at(-1) ?? 0;
  return Array.from({ length: n }, (_, k) => {
    const target = (total * k) / (n - 1);
    const found = along.findIndex((s) => s >= target);
    const i = found < 1 ? (found === 0 ? 1 : along.length - 1) : found;
    const s0 = along[i - 1] ?? 0;
    const s1 = along[i] ?? s0;
    const t = s1 > s0 ? (target - s0) / (s1 - s0) : 0;
    return lerpVec(points[i - 1]!, points[i]!, t);
  });
}

/** An authored path made ready to draw and to morph: smoothed through
 *  its control points and resampled to SAMPLES. */
export const pose = (control: readonly Vec2[]): Vec2[] => resample(smooth(control, 8), SAMPLES);

// ─── The morph ─────────────────────────────────────────────────────

/** The fold wave: segment `i` of `n` gets its own delayed progress,
 *  so a bend travels along the tube rather than arriving everywhere
 *  at once. `span` is how much of the whole progress the delay spreads
 *  over; the wave runs from the head on entry and from the tail on
 *  exit. */
export function wave(t: number, i: number, n: number, span: number, from: 'head' | 'tail'): number {
  const place = n <= 1 ? 0 : i / (n - 1);
  const delay = (from === 'head' ? place : 1 - place) * span;
  return smoothstep((t - delay) / (1 - span));
}

/** Between two bends, segment by segment: slerp the headings, lerp the
 *  lengths, lerp the start. `progress` gives each segment its own t. */
export function morph(from: Bends, to: Bends, progress: (i: number) => number): Bends {
  return {
    start: lerpVec(from.start, to.start, progress(0)),
    angles: from.angles.map((a, i) => a + turn(a, to.angles[i] ?? a) * progress(i)),
    lengths: from.lengths.map((l, i) => lerp(l, to.lengths[i] ?? l, progress(i))),
  };
}

/** Bend one pose into another by `t` ∈ [0, 1], the wave running from
 *  `from`. Both poses are SAMPLES points. */
export function bend(
  a: readonly Vec2[],
  b: readonly Vec2[],
  t: number,
  from: 'head' | 'tail',
  span = 0.5,
): Vec2[] {
  const n = a.length - 1;
  return pointsOf(morph(bendsOf(a), bendsOf(b), (i) => wave(t, i, n, span, from)));
}

/** The turning angle at an interior point — where a straw is bent
 *  hard enough, the painter draws the ribs of its elbow. */
export function turnAt(points: readonly Vec2[], i: number): number {
  const before = points[i - 1];
  const here = points[i];
  const after = points[i + 1];
  if (!before || !here || !after) return 0;
  const inbound = Math.atan2(here.y - before.y, here.x - before.x);
  const outbound = Math.atan2(after.y - here.y, after.x - here.x);
  return Math.abs(turn(inbound, outbound));
}
