interface PolestarProps {
  /** Center position in the SVG's viewBox space. */
  cx: number;
  cy: number;
  /** Half-side of the figure's outermost bounds in viewBox units —
   *  drives the ray burst length. */
  half?: number;
}

// The polestar — the iconic central star around which the heavens
// rotate. The first form inlined the Foyer's geometric figure (two
// nested rects + four corner diagonals + central circle) per the
// design's "the figure ascended" commitment. In practice the nested
// wireframe added to the geometric / graph-polygon feel of the
// surface — the user's lived reading was that it competed with the
// stars rather than crowning them. This simpler form keeps the
// 8-point ray burst (the iconic Hevelius compass-rose mark) and a
// bright central body that reads as one luminous star, the
// brightest in the sky.
//
// CONSTELLATION.md §"The polestar" still names the figure ascending
// as the held form; if a future surface wants the geometric figure
// itself rendered at the polestar's location, it can layer in via a
// separate GeometricFigure mount — the spec's stillness commitment
// (the polestar doesn't rotate with the heavens) is preserved either
// way.

export function Polestar({ cx, cy, half = 60 }: PolestarProps) {
  return (
    <g aria-hidden="true" className="constellation-polestar">
      <PolestarRays cx={cx} cy={cy} length={half * 1.6} />
      <PolestarBody cx={cx} cy={cy} />
    </g>
  );
}

// Eight short spikes radiating from the polestar's center —
// cardinal + ordinal directions. The cardinal pair is longer; the
// ordinal pair is shorter. Together they read as the iconic
// compass-rose burst the Hevelius engravings carry as the marker
// for the brightest stars. The strokes use --polestar-rays so each
// theme picks its own gold-cream value.
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

// The central body — a brighter, larger version of the regular
// star body. Wraps in a halo + tint so the polestar reads as the
// star with the most light in the sky.
function PolestarBody({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className="constellation-polestar__body" aria-hidden="true">
      <circle cx={cx} cy={cy} r={28} fill="url(#cn-star-halo)" opacity="0.7" />
      <circle cx={cx} cy={cy} r={14} fill="url(#cn-star-halo)" opacity="0.85" />
      <circle cx={cx} cy={cy} r={6} fill="var(--star-cream)" />
    </g>
  );
}
