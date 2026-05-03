interface PolestarProps {
  /** Center position in the SVG's viewBox space. */
  cx: number;
  cy: number;
  /** Half-side of the figure's outermost square in viewBox units. */
  half?: number;
}

// The polestar — the geometric figure ascended into the firmament,
// the still point around which the constellation rotates. Inlines
// the same five geometric primitives as src/shared/atoms/
// GeometricFigure (two nested rects, four diagonal lines, central
// circle), positioned in the constellation's viewBox space, and
// wraps them in an eight-point ray burst — short radial spikes of
// gold-cream that read as the brightest moment in the sky.
//
// The figure here does NOT carry the 60-second self-rotation that
// the Foyer figure does — it is the *still* center; the
// constellation rotates around it. CONSTELLATION.md §"The polestar"
// names this stillness. The ray burst is the iconic identity the
// Hevelius reference (CONSTELLATION_DESIGN.md §"Aesthetic
// References") commits to, made concrete: this is the polestar
// because it shines further than anything else.
//
// A brief duplication of the figure's geometry (vs. extracting a
// shared GeometricFigureGeometry atom) is held intentionally — per
// the design system's "anticipation > use repeats" discipline. If a
// third use emerges, refactor.

export function Polestar({ cx, cy, half = 60 }: PolestarProps) {
  const x = cx - half;
  const y = cy - half;
  const innerHalf = half * 0.583;
  const innerX = cx - innerHalf;
  const innerY = cy - innerHalf;
  const innerCorner = half * 0.25;
  return (
    <g aria-hidden="true" className="constellation-polestar">
      <PolestarRays cx={cx} cy={cy} length={half * 1.45} />
      <g opacity="0.85">
        <rect
          x={x}
          y={y}
          width={half * 2}
          height={half * 2}
          rx="2"
          fill="none"
          strokeWidth="0.5"
          stroke="var(--geo-color)"
        />
        <rect
          x={innerX}
          y={innerY}
          width={innerHalf * 2}
          height={innerHalf * 2}
          rx="1"
          fill="none"
          strokeWidth="0.3"
          stroke="var(--geo-color)"
        />
        <line
          x1={x}
          y1={y}
          x2={x + innerCorner}
          y2={y + innerCorner}
          strokeWidth="0.3"
          stroke="var(--geo-color)"
        />
        <line
          x1={x + half * 2}
          y1={y}
          x2={x + half * 2 - innerCorner}
          y2={y + innerCorner}
          strokeWidth="0.3"
          stroke="var(--geo-color)"
        />
        <line
          x1={x}
          y1={y + half * 2}
          x2={x + innerCorner}
          y2={y + half * 2 - innerCorner}
          strokeWidth="0.3"
          stroke="var(--geo-color)"
        />
        <line
          x1={x + half * 2}
          y1={y + half * 2}
          x2={x + half * 2 - innerCorner}
          y2={y + half * 2 - innerCorner}
          strokeWidth="0.3"
          stroke="var(--geo-color)"
        />
        <circle
          cx={cx}
          cy={cy}
          r={half * 0.333}
          fill="none"
          strokeWidth="0.3"
          stroke="var(--geo-accent)"
        />
      </g>
    </g>
  );
}

// Eight short spikes radiating from the polestar's center —
// cardinal + ordinal directions. The cardinal pair is longer; the
// ordinal pair is shorter. Together they read as the iconic
// compass-rose burst the Hevelius engravings carry as the marker
// for the brightest stars. The strokes use --polestar-rays so
// each theme picks its own gold-cream value.
function PolestarRays({ cx, cy, length }: { cx: number; cy: number; length: number }) {
  const long = length;
  const short = length * 0.62;
  const diagShort = short * 0.7071;
  return (
    <g className="constellation-polestar__rays" aria-hidden="true">
      {/* Cardinal: N / E / S / W — the four primary spikes */}
      <line x1={cx} y1={cy - long} x2={cx} y2={cy - long * 0.18} />
      <line x1={cx + long} y1={cy} x2={cx + long * 0.18} y2={cy} />
      <line x1={cx} y1={cy + long} x2={cx} y2={cy + long * 0.18} />
      <line x1={cx - long} y1={cy} x2={cx - long * 0.18} y2={cy} />
      {/* Ordinal: NE / SE / SW / NW — the four secondary spikes */}
      <line
        x1={cx + diagShort}
        y1={cy - diagShort}
        x2={cx + diagShort * 0.3}
        y2={cy - diagShort * 0.3}
      />
      <line
        x1={cx + diagShort}
        y1={cy + diagShort}
        x2={cx + diagShort * 0.3}
        y2={cy + diagShort * 0.3}
      />
      <line
        x1={cx - diagShort}
        y1={cy + diagShort}
        x2={cx - diagShort * 0.3}
        y2={cy + diagShort * 0.3}
      />
      <line
        x1={cx - diagShort}
        y1={cy - diagShort}
        x2={cx - diagShort * 0.3}
        y2={cy - diagShort * 0.3}
      />
    </g>
  );
}
