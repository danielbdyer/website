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
// circle), positioned in the constellation's viewBox space.
//
// The figure here does NOT carry the 60-second self-rotation that
// the Foyer figure does — it is the *still* center; the constellation
// rotates around it. CONSTELLATION.md §"The polestar" names this
// stillness as the architectural inversion: the figure that turned
// in the Foyer, ascended, becomes the axis the heavens turn upon.
//
// A brief duplication of the figure's geometry (vs. extracting a
// shared GeometricFigureGeometry atom) is held intentionally — per
// the design system's "anticipation > use repeats" discipline. If a
// third use emerges, refactor.
//
// In the sky the figure is drawn in gold ink (tokens.css
// `.constellation-polestar`) — the chart's compass figure — and two
// thin rings circle it: the chart's circles around the still center.
// The rings render after the figure so the figure's own circle stays
// the first `<circle>` in document order.

export function Polestar({ cx, cy, half = 60 }: PolestarProps) {
  const x = cx - half;
  const y = cy - half;
  const innerHalf = half * 0.583;
  const innerX = cx - innerHalf;
  const innerY = cy - innerHalf;
  const innerCorner = half * 0.25;
  return (
    <g aria-hidden="true" opacity="0.85" className="constellation-polestar">
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
      {CORNERS.map(([sx, sy]) => (
        <line
          key={`${sx}${sy}`}
          x1={cx + sx * half}
          y1={cy + sy * half}
          x2={cx + sx * (half - innerCorner)}
          y2={cy + sy * (half - innerCorner)}
          strokeWidth="0.3"
          stroke="var(--geo-color)"
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r={half * 0.333}
        fill="none"
        strokeWidth="0.3"
        stroke="var(--geo-accent)"
        className="constellation-polestar__ornament"
      />
      {RINGS.map((ring) => (
        <circle
          key={ring.scale}
          cx={cx}
          cy={cy}
          r={half * ring.scale}
          fill="none"
          strokeWidth={ring.width}
          stroke="var(--geo-color)"
          opacity={ring.opacity}
          className="constellation-polestar__ring"
        />
      ))}
    </g>
  );
}

/** The four diagonal ticks, one per corner of the outer square, each
 *  running inward from the corner by a quarter of the half-side. */
const CORNERS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;

/** The chart's two circles around the still center — radii as
 *  multiples of the figure's half-side, widening and fading outward. */
const RINGS = [
  { scale: 1.6, width: 0.35, opacity: 0.55 },
  { scale: 2.35, width: 0.3, opacity: 0.32 },
] as const;
