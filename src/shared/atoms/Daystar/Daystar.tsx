import { DAYSTAR_TRANSITION_NAME } from '@/shared/utils/view-transition-names';

interface DaystarProps {
  /** Center position in the SVG's viewBox space. */
  cx: number;
  cy: number;
  /** Radius of the celestial body. The glow extends beyond. */
  radius?: number;
}

// The daystar — sun by day, moon by night. Both bodies render in the
// DOM; the active one is selected by CSS based on the html element's
// `.lt` / `.dk` class. This avoids the hydration flash that a JS-
// conditional `dark ? <Sun /> : <Moon />` render would cause: the
// inline init script in __root.tsx applies the theme class before
// React hydrates, so the right body is visible from first paint
// without depending on hook state.
//
// The body sits high in the firmament (caller decides cx/cy). It is
// addressable but decorative — `aria-hidden`, no link. The nav's
// theme toggle remains the canonical control; the daystar is the
// visual representation of the room's hour, not its own actuator.
//
// CONSTELLATION.md §"The Sun and the Moon" describes the held richer
// gesture (the toggle ascends from the nav into the firmament). This
// atom is the first form: the daystar simply *is* in the sky when
// the visitor reaches /sky, theme-coherent from first paint.

export function Daystar({ cx, cy, radius = 38 }: DaystarProps) {
  return (
    <g
      className="constellation-daystar"
      style={{ viewTransitionName: DAYSTAR_TRANSITION_NAME }}
      aria-hidden="true"
    >
      {/* The sun — visible in light mode. A gilded disc: gold leaf
          laid on the chart (the `cn-sun-leaf` gradient), a thin warm
          rim where the leaf meets the paper, and a soft corona through
          the watercolor filter. One body, not concentric rings — the
          chart's sun, not a target. */}
      <g className="constellation-daystar__sun">
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.9}
          fill="var(--accent-gold)"
          opacity={0.12}
          filter="url(#cn-watercolor-halo)"
        />
        <circle cx={cx} cy={cy} r={radius} fill="url(#cn-sun-leaf)" opacity={0.86} />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--accent-warm)"
          strokeWidth={0.9}
          opacity={0.55}
        />
      </g>
      {/* The moon — visible in dark mode. A cooler crescent with a
          soft halo. The crescent is two overlapping circles using
          a mask: the moon disc, minus a slightly-offset circle to
          carve out the dark side. */}
      <g className="constellation-daystar__moon">
        <defs>
          <mask id="cn-moon-mask">
            <rect
              x={cx - radius * 2}
              y={cy - radius * 2}
              width={radius * 4}
              height={radius * 4}
              fill="white"
            />
            <circle cx={cx + radius * 0.45} cy={cy - radius * 0.1} r={radius * 0.95} fill="black" />
          </mask>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={radius * 1.7}
          fill="var(--accent-rose)"
          opacity={0.14}
          filter="url(#cn-watercolor-halo)"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="var(--text-2)"
          opacity={0.85}
          mask="url(#cn-moon-mask)"
        />
      </g>
    </g>
  );
}
