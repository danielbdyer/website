import type { ConstellationHue } from '@/shared/content/constellation';

interface StarMarkProps {
  /** Visual hue from the work's primary facet. */
  hue: ConstellationHue;
  /** Preview/draft works render the body quieter. */
  isPreview?: boolean;
  /** Animation-delay (in seconds) for the halo's twinkle keyframe.
   *  Set per-star by the organism so adjacent halos don't pulse in
   *  sync. */
  twinkleDelay?: number;
}

const HUE_VAR: Record<ConstellationHue, string> = {
  warm: 'var(--accent-warm)',
  rose: 'var(--accent-rose)',
  violet: 'var(--accent-violet)',
  gold: 'var(--accent-gold)',
};

// The bare visual mark of a star — facet halo + gold-as-attention
// overlay + body + the echo's two rings + hit target. All circles
// render at (0, 0); the parent group's `transform` places the mark on
// screen, and the wrapping `<Star>` molecule provides the addressable
// anchor + visible label + active-state routing via data-active. The
// echo rings are invisible at rest and widen out of a claimed star
// (tokens.css `.constellation-star__echo`).
//
// Atomic contract (REACT_NORTH_STAR.md §"Atoms"): zero state,
// zero effects, fully controlled via props, ≤5 props, ≤40 lines.
// CSS in tokens.css drives the active-state crescendo, the gold
// overlay's opacity, and the twinkle. CONSTELLATION_DESIGN.md
// §"C2. Star" names the anatomy this atom realizes.

export function StarMark({ hue, isPreview = false, twinkleDelay }: StarMarkProps) {
  const colorVar = HUE_VAR[hue];
  const haloStyle = twinkleDelay !== undefined ? { animationDelay: `${twinkleDelay}s` } : undefined;
  return (
    <>
      <circle
        r={4.6}
        fill={colorVar}
        filter="url(#cn-watercolor-halo)"
        style={haloStyle}
        className="constellation-star__halo pointer-events-none"
      />
      <circle
        r={6.2}
        fill="var(--accent-gold)"
        filter="url(#cn-watercolor-halo)"
        className="constellation-star__gold pointer-events-none"
      />
      <circle
        r={1.8}
        fill={colorVar}
        opacity={isPreview ? 0.55 : 1}
        className="constellation-star__body"
      />
      <circle
        r={10}
        fill="none"
        stroke="var(--accent-gold)"
        strokeWidth={0.6}
        className="constellation-star__echo constellation-star__echo--1 pointer-events-none"
      />
      <circle
        r={16.5}
        fill="none"
        stroke="var(--accent-gold)"
        strokeWidth={0.45}
        className="constellation-star__echo constellation-star__echo--2 pointer-events-none"
      />
      <circle r={12} fill="transparent" className="constellation-star__hit" />
    </>
  );
}
