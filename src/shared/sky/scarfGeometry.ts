// The magic scarf, as pure geometry.
//
// A ribbon of silk that swoops around the daystar's face in three
// dimensions: its spine is an arc of a tilted circle about the face,
// fluttering with a traveling wave; its width swells in the middle
// and tapers to nothing at both tails; and it passes behind the face
// and comes out in front, so the caller draws two pieces — one beneath
// the disc, one over it. Everything here is a function of a shape and
// nothing else; the driver (dom/daystarMagic.ts) advances the shape's
// phases each frame and writes the paths. CONSTELLATION.md §"The Sun
// and the Moon"; CONSTELLATION_STORYBOARD.md §"Scene 12".

/** The center of the daystar's 240-unit square, which the scarf orbits. */
export const FACE_CENTER = 120;

export interface ScarfShape {
  /** The orbit's radius about the face's center, in viewbox units. */
  readonly radius: number;
  /** The orbit plane's tilt from the screen, radians — what sends the
   *  scarf behind and in front. */
  readonly tilt: number;
  /** The orbit plane's turn about the screen's vertical, radians. */
  readonly spin: number;
  /** The scarf's length along the orbit, radians. */
  readonly length: number;
  /** Where the scarf's head is on the orbit, radians. */
  readonly phase: number;
  /** The ribbon's half-width at its fullest, viewbox units. */
  readonly width: number;
  /** The flutter's amplitude, viewbox units, and its phase. */
  readonly wave: number;
  readonly wavePhase: number;
  /** How much depth scales the drawing: 0 flat, ~0.4 a gentle lens. */
  readonly perspective: number;
}

export interface ScarfPaths {
  readonly behind: string;
  readonly front: string;
  readonly sheenBehind: string;
  readonly sheenFront: string;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Sample extends Point {
  readonly front: boolean;
  readonly w: number;
}

interface Piece {
  readonly front: boolean;
  readonly left: readonly Point[];
  readonly right: readonly Point[];
}

/** The spine's point on the orbit at `u`, projected to the screen,
 *  with its depth's sign and its width there. */
function sampleAt(shape: ScarfShape, cx: number, cy: number, s: number): Sample {
  const u = shape.phase + s * shape.length;
  const flutter = shape.wave * Math.sin(3 * u + shape.wavePhase);
  const x0 = shape.radius * Math.cos(u);
  const y0 = shape.radius * Math.sin(u) * Math.cos(shape.tilt) + flutter;
  const z0 = shape.radius * Math.sin(u) * Math.sin(shape.tilt);
  const x = x0 * Math.cos(shape.spin) + z0 * Math.sin(shape.spin);
  const z = -x0 * Math.sin(shape.spin) + z0 * Math.cos(shape.spin);
  const lens = 1 + (z / shape.radius) * shape.perspective;
  const taper = Math.sin(Math.PI * s) ** 1.3;
  const ripple = 1 + 0.22 * Math.sin(5 * u + shape.wavePhase * 1.3);
  return {
    x: cx + x * lens,
    y: cy - y0 * lens,
    front: z >= 0,
    w: shape.width * taper * ripple * lens,
  };
}

const fmt = (p: Point): string => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

function piecePath(piece: Piece): string {
  if (piece.left.length < 2) return '';
  const forward = piece.left.map((p, i) => (i === 0 ? `M ${fmt(p)}` : `L ${fmt(p)}`)).join(' ');
  const back = piece.right
    .toReversed()
    .map((p) => `L ${fmt(p)}`)
    .join(' ');
  return `${forward} ${back} Z`;
}

/** Split a run of edge points into pieces by depth, sharing the point
 *  where the scarf crosses the screen plane so no seam shows. */
function splitByDepth(
  samples: readonly Sample[],
  edge: (i: number) => readonly [Point, Point],
): readonly Piece[] {
  const closed = samples.reduce<{ pieces: readonly Piece[]; open: Piece | null }>(
    (acc, sample, i) => {
      const [l, r] = edge(i);
      const open = acc.open;
      if (open?.front === sample.front) {
        return { ...acc, open: { ...open, left: [...open.left, l], right: [...open.right, r] } };
      }
      const started: Piece = { front: sample.front, left: [l], right: [r] };
      if (!open) return { ...acc, open: started };
      const sealed: Piece = { ...open, left: [...open.left, l], right: [...open.right, r] };
      return { pieces: [...acc.pieces, sealed], open: started };
    },
    { pieces: [], open: null },
  );
  return closed.open ? [...closed.pieces, closed.open] : closed.pieces;
}

/** The scarf's four paths for a shape, about a center. */
export function scarfPaths(shape: ScarfShape, cx: number, cy: number, samples = 44): ScarfPaths {
  const points = Array.from({ length: samples + 1 }, (_, i) =>
    sampleAt(shape, cx, cy, i / samples),
  );
  const normalAt = (i: number): Point => {
    const a = points[Math.max(i - 1, 0)]!;
    const b = points[Math.min(i + 1, samples)]!;
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const m = Math.hypot(tx, ty) || 1;
    return { x: -ty / m, y: tx / m };
  };
  const along = (i: number, from: number, to: number): readonly [Point, Point] => {
    const p = points[i]!;
    const n = normalAt(i);
    return [
      { x: p.x + n.x * p.w * from, y: p.y + n.y * p.w * from },
      { x: p.x + n.x * p.w * to, y: p.y + n.y * p.w * to },
    ];
  };
  const body = splitByDepth(points, (i) => along(i, 1, -1));
  const sheen = splitByDepth(points, (i) => along(i, 0.56, 0.3));
  const join = (pieces: readonly Piece[], front: boolean): string =>
    pieces
      .flatMap((piece) => {
        if (piece.front !== front) return [];
        const d = piecePath(piece);
        return d.length > 0 ? [d] : [];
      })
      .join(' ');
  return {
    behind: join(body, false),
    front: join(body, true),
    sheenBehind: join(sheen, false),
    sheenFront: join(sheen, true),
  };
}

/** The scarf at rest about the daystar: a wide, slow orbit, a little
 *  tilted, a gentle lens. The driver breathes these with its moods. */
export const SCARF_AT_REST: ScarfShape = {
  radius: 82,
  tilt: 0.85,
  spin: 0,
  length: 3.4,
  phase: 0,
  width: 12,
  wave: 5,
  wavePhase: 0,
  perspective: 0.38,
};

/** The wisps: two thinner strands that keep the main one company — a
 *  little ahead and a little behind it on the orbit, fluttering on
 *  their own phases — so the scarf reads as silk that parts like
 *  smoke rather than as one ribbon. Each is the main strand's shape,
 *  offset. */
const WISPS = [
  { phase: 0.55, radius: 5, width: 0.38, wave: 1.7, wavePhase: 1.1, length: 0.8 },
  { phase: -0.42, radius: -3, width: 0.3, wave: 1.4, wavePhase: 2.3, length: 0.72 },
] as const;

export const STRAND_COUNT = WISPS.length + 1;

/** The scarf's strands for a main shape: the main strand first, then
 *  its wisps. */
export function strandShapes(main: ScarfShape): readonly ScarfShape[] {
  return [
    main,
    ...WISPS.map((w) => ({
      ...main,
      phase: main.phase + w.phase,
      radius: main.radius + w.radius,
      width: main.width * w.width,
      wave: main.wave * w.wave,
      wavePhase: main.wavePhase + w.wavePhase,
      length: main.length * w.length,
    })),
  ];
}
