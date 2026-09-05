// The daystar's drawing, as pure geometry: the hand's circle, the
// crown in splendour, the moon's profile, the sparkle. No React — the
// atom (DaystarFace) and the molecule (Daystar) render these paths,
// and the tests hold them as values. Every shape lives in a 240-unit
// square with the disc at its center.

export const CENTER = 120;
export const DISC_RADIUS = 60;

// A hand's circle: sixteen points, each a breath off the true radius,
// joined by quadratic curves through their midpoints so the rim is
// smooth but never mechanical. The jitter is fixed, so the face is the
// same face on every visit.
const DISC_JITTER = [
  0.012, -0.008, 0.016, -0.014, 0.006, -0.01, 0.014, -0.006, 0.01, -0.016, 0.008, -0.012, 0.015,
  -0.005, 0.009, -0.011,
];

export function wobblyDisc(cx: number, cy: number, r: number, jitter: readonly number[]): string {
  const n = jitter.length;
  const points = jitter.map((j, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + r * (1 + j) * Math.cos(a), cy + r * (1 + j) * Math.sin(a)] as const;
  });
  const mid = (i: number): string => {
    const p = points[i % n]!;
    const q = points[(i + 1) % n]!;
    return `${((p[0] + q[0]) / 2).toFixed(2)} ${((p[1] + q[1]) / 2).toFixed(2)}`;
  };
  const curves = points.map((_, i) => {
    const c = points[(i + 1) % n]!;
    return `Q ${c[0].toFixed(2)} ${c[1].toFixed(2)} ${mid(i + 1)}`;
  });
  return `M ${mid(0)} ${curves.join(' ')} Z`;
}

export const DISC_PATH = wobblyDisc(CENTER, CENTER, DISC_RADIUS, DISC_JITTER);

/** The classic four-point sparkle, its sides drawn in toward the center. */
export function fourPointStar(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
}

// ─── The crown, in splendour ───────────────────────────────────────
//
// The heraldic sun: sixteen rays, straight and wavy by turns — the
// engraver's sun on an astronomical clock's dial rather than a card's
// burst. Each is cut a little differently. Rays are drawn pointing up
// from the disc's rim; the atom rotates each to its bearing.

const RAY_BASE = CENTER - (DISC_RADIUS - 4);

const RAY_JITTER = [
  0.03, -0.05, 0.06, -0.02, 0.04, -0.06, 0.02, -0.04, 0.05, -0.01, 0.01, -0.07, 0.07, -0.03, 0.045,
  -0.035,
];

/** A straight ray: a narrow flame of gold, its tip a point. */
export function straightRay(length: number, halfWidth: number): string {
  return `M ${CENTER - halfWidth} ${RAY_BASE} L ${CENTER} ${(RAY_BASE - length).toFixed(1)} L ${CENTER + halfWidth} ${RAY_BASE} Z`;
}

/** A wavy ray: the same flame, undulating once on its way to the tip. */
export function wavyRay(length: number, halfWidth: number): string {
  const a = halfWidth * 0.9;
  const tip = `${CENTER} ${(RAY_BASE - length).toFixed(1)}`;
  const y = (f: number): string => (RAY_BASE - length * f).toFixed(1);
  return [
    `M ${CENTER - halfWidth} ${RAY_BASE}`,
    `C ${(CENTER - halfWidth - a).toFixed(1)} ${y(0.28)} ${(CENTER + a * 0.7).toFixed(1)} ${y(0.55)} ${tip}`,
    `C ${(CENTER + halfWidth + a * 0.3).toFixed(1)} ${y(0.5)} ${(CENTER + halfWidth - a * 0.5).toFixed(1)} ${y(0.24)} ${CENTER + halfWidth} ${RAY_BASE}`,
    'Z',
  ].join(' ');
}

export interface Ray {
  readonly angle: number;
  readonly kind: 'straight' | 'wavy';
  readonly d: string;
}

export const RAYS: readonly Ray[] = RAY_JITTER.map((jitter, k) => {
  const straight = k % 2 === 0;
  return {
    angle: k * 22.5,
    kind: straight ? 'straight' : 'wavy',
    d: straight ? straightRay(50 * (1 + jitter), 4.6) : wavyRay(42 * (1 + jitter), 5.6),
  };
});

// ─── The moon, in profile ──────────────────────────────────────────
//
// A crescent whose inner edge is a face turned to the left, asleep —
// the moon a picture book keeps at the sun's shoulder. The outer edge
// is the disc's own rim, on the right; the horns meet the rim at its
// top and foot; the inner edge bulges right so the lit body is a
// true crescent, with the dark of the disc — the earthshine — in its
// hollow. Coordinates were set by hand: forehead, brow, the bridge
// and tip of the nose, the lips, the chin, the throat.

export const MOON_HORN_TOP = { x: 108, y: 61.2 } as const;
export const MOON_HORN_FOOT = { x: 110, y: 179.2 } as const;

export const MOON_PROFILE = [
  `M ${MOON_HORN_TOP.x} ${MOON_HORN_TOP.y}`,
  'C 118 66, 130 74, 134 84',
  'C 135.5 88, 135 93, 131 97',
  'C 128 100, 124 106, 122 113',
  'C 121 115.5, 123.5 117.5, 128 118',
  'C 131 118.5, 133 119, 133.5 121',
  'C 133 124, 130 125, 129.5 127',
  'C 131.5 127.5, 133 128, 132 130',
  'C 129.5 131, 128.5 133, 130 136',
  'C 133 138, 136.5 141, 136 146',
  'C 135.5 150, 132 153, 129 156',
  `C 124 161, 118 170, ${MOON_HORN_FOOT.x} ${MOON_HORN_FOOT.y}`,
  `A ${DISC_RADIUS} ${DISC_RADIUS} 0 1 0 ${MOON_HORN_TOP.x} ${MOON_HORN_TOP.y}`,
  'Z',
].join(' ');

// ─── The moon's back ───────────────────────────────────────────────
//
// Seen from behind — as the room sees it in the nav's corner — the
// moon is a plain crescent lit on the left: the disc's left rim for
// its outer edge, a wider arc bulging left for its inner one, the
// horns at the disc's top and foot. The ascent turns it half round
// to show the face (CONSTELLATION.md §"The Sun and the Moon").

export const MOON_BACK = [
  `M ${CENTER} ${CENTER - DISC_RADIUS}`,
  `A ${DISC_RADIUS} ${DISC_RADIUS} 0 0 0 ${CENTER} ${CENTER + DISC_RADIUS}`,
  `A 80 80 0 0 1 ${CENTER} ${CENTER - DISC_RADIUS}`,
  'Z',
].join(' ');
