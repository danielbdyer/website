import { VIEWBOX } from '@/shared/organisms/Constellation/layout';

// The horizon — a silhouette mountain ridge at the bottom of the
// constellation viewport. Renders OUTSIDE the rotating layer so it
// stays anchored as the camera moves; the sphere appears to rise
// from behind it. Hevelius-reference's celestial-dome-rising-from-
// the-earth figure, made literal.
//
// Composition is intentionally simple — one quadratic-curve path
// with a solid fill plus a vertical glow gradient just above the
// ridge line. Two-layer mountains + multiple gradients regressed
// xvfb's frame budget noticeably (large filled SVG paths cost real
// per-frame paint work in software rendering); this single-path
// form keeps the silhouette but stays cheap. The reference's
// mistier far-mountain layer can return as a static SVG asset
// later if the surface earns it.

const HORIZON_BASE_Y = 880;

const MOUNTAIN_PATH = [
  `M 0,${HORIZON_BASE_Y}`,
  `Q 100,${HORIZON_BASE_Y - 60} 200,${HORIZON_BASE_Y - 30}`,
  `Q 290,${HORIZON_BASE_Y - 90} 380,${HORIZON_BASE_Y - 50}`,
  `Q 470,${HORIZON_BASE_Y - 110} 560,${HORIZON_BASE_Y - 60}`,
  `Q 650,${HORIZON_BASE_Y - 100} 740,${HORIZON_BASE_Y - 40}`,
  `Q 850,${HORIZON_BASE_Y - 80} 1000,${HORIZON_BASE_Y - 30}`,
  `L ${VIEWBOX},${VIEWBOX} L 0,${VIEWBOX} Z`,
].join(' ');

export function Horizon() {
  return (
    <g aria-hidden="true" className="constellation-horizon pointer-events-none">
      <defs>
        {/* Warm horizon glow — a vertical gradient just above the
            mountain line. Suggests the setting sun's wash where the
            celestial dome meets the earth. Single gradient, single
            rect — cheap to composite even on software rendering. */}
        <linearGradient
          id="cn-horizon-glow"
          x1="0"
          y1={String(HORIZON_BASE_Y - 180)}
          x2="0"
          y2={String(HORIZON_BASE_Y)}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--star-halo)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--star-halo)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect
        x="0"
        y={HORIZON_BASE_Y - 180}
        width={VIEWBOX}
        height="180"
        fill="url(#cn-horizon-glow)"
      />
      <path d={MOUNTAIN_PATH} fill="#150f1c" fillOpacity="0.96" />
    </g>
  );
}
