// The daystar's drawing, as pure geometry: the hand's circle, the
// crown's flames, the sparkle. No React — the atom (DaystarFace) and
// the molecule (Daystar) render these paths, and the tests hold them
// as values. Every shape lives in a 240-unit square with the disc at
// its center.

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

// The crown: sixteen flames, long and short by turns, each cut a
// little differently, leaning as a flame leans.
const RAY_JITTER = [
  0.04, -0.06, 0.08, -0.03, 0.05, -0.07, 0.02, -0.05, 0.07, -0.02, 0.04, -0.08, 0.03, -0.04, 0.06,
  -0.03,
];

export function rayPath(long: boolean, jitter: number): string {
  const base = CENTER - (DISC_RADIUS - 3);
  const length = (long ? 44 : 27) * (1 + jitter);
  const half = long ? 8.5 : 6;
  const lean = long ? 3 : -2;
  const waist = (base - length * 0.55).toFixed(1);
  const tip = `${CENTER + lean} ${(base - length).toFixed(1)}`;
  return `M ${CENTER - half} ${base} Q ${CENTER - half * 0.55 + lean * 0.4} ${waist} ${tip} Q ${CENTER + half * 0.55 + lean * 0.4} ${waist} ${CENTER + half} ${base} Z`;
}

export interface Ray {
  readonly angle: number;
  readonly d: string;
}

export const RAYS: readonly Ray[] = RAY_JITTER.map((jitter, k) => ({
  angle: k * 22.5,
  d: rayPath(k % 2 === 0, jitter),
}));
