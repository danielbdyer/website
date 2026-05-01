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

export function Polestar({ cx, cy, half = 60 }: PolestarProps) {
  const x = cx - half;
  const y = cy - half;
  const innerHalf = half * 0.583;
  const innerX = cx - innerHalf;
  const innerY = cy - innerHalf;
  const innerCorner = half * 0.25;
  return (
    <g aria-hidden="true" opacity="0.85">
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
  );
}
