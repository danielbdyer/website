import type { ConstellationHue } from '@/shared/content/constellation';

interface StarMarkProps {
  /** Visual hue from the work's primary facet. Used as a faint outer
   *  tint mixed into the gold-cream halo so the constellation reads
   *  as a sky with category as accent rather than a category map
   *  painted as a sky. */
  hue: ConstellationHue;
  /** Preview/draft works render the body quieter. */
  isPreview?: boolean;
  /** Per-star twinkle phase (seconds). Forwarded to the WebGL
   *  atmospheric layer's halo broadcast so each star breathes on
   *  its own beat there; the SVG body itself stays static (per-
   *  frame opacity on N filtered elements inside a rotating
   *  compositor layer regressed the perf budget the surface holds). */
  twinkleDelay?: number;
}

const HUE_VAR: Record<ConstellationHue, string> = {
  warm: 'var(--accent-warm)',
  rose: 'var(--accent-rose)',
  violet: 'var(--accent-violet)',
  gold: 'var(--accent-gold)',
};

/** Quadratic-Bezier path for a 4-point sparkle star. Cardinal points
 *  sit at radius OUTER; the curves dip inward toward INNER between
 *  each pair of points, giving the canonical sparkle silhouette —
 *  pointed at N/E/S/W with concave curves between. Drawn once as a
 *  static string since every star renders with the same shape. */
const STAR_OUTER = 9;
const STAR_INNER = 2.4;
const SPARKLE_STAR_PATH = [
  `M 0,${-STAR_OUTER}`,
  `Q ${STAR_INNER},${-STAR_INNER} ${STAR_OUTER},0`,
  `Q ${STAR_INNER},${STAR_INNER} 0,${STAR_OUTER}`,
  `Q ${-STAR_INNER},${STAR_INNER} ${-STAR_OUTER},0`,
  `Q ${-STAR_INNER},${-STAR_INNER} 0,${-STAR_OUTER}`,
  'Z',
].join(' ');

// The bare visual mark of a star — gold-cream body + warm halo +
// cross-burst spike rays + facet-tinted outer glow + hit target.
// All five elements render at (0, 0); the parent group's `transform`
// places the mark on screen, and the wrapping `<Star>` molecule
// provides the addressable anchor + visible label + active-state
// routing via data-active.
//
// Hevelius register (CONSTELLATION_DESIGN.md §"Aesthetic References
// — Star atlases"): bright cream-gold dominant; warm-amber halo;
// facet hue is a faint outer tint, not the star's primary color.
//
// Atomic contract (REACT_NORTH_STAR.md §"Atoms"): zero state, zero
// effects, fully controlled via props, ≤5 props, ≤40 lines. CSS in
// tokens.css drives the active-state crescendo and the twinkle.

export function StarMark({ hue, isPreview = false, twinkleDelay }: StarMarkProps) {
  const tintVar = HUE_VAR[hue];
  // twinkleDelay flows in from the organism for the WebGL halo's
  // per-star phase (broadcast through atmosphericScene); the body's
  // SVG side does nothing with it. data-twinkle-phase is here as a
  // future-form hook in case a non-animation visual cue earns its
  // place (e.g. a small phase-driven static rotation of the spike
  // rays per-star). Cheap to keep.
  return (
    <>
      {/* Outer facet tint — wide soft disc carrying the work's
          category color via a radial gradient on currentColor. The
          gradient's center → edge falloff gives the tint a paper-
          glow character without an SVG filter. Style sets
          currentColor to the facet token so the gradient picks it
          up cleanly. */}
      <circle
        r={15}
        fill="url(#cn-star-tint)"
        style={{ color: tintVar }}
        className="constellation-star__tint pointer-events-none"
      />
      {/* Warm-amber halo — the held-lamp glow. Radial gradient is
          GPU-composited and essentially free per element;
          watercolor filter retired here for perf at the supersized
          radii the Hevelius register asks for. */}
      <circle
        r={10}
        fill="url(#cn-star-halo)"
        className="constellation-star__halo pointer-events-none"
      />
      {/* Bright cream-gold body — a 4-point sparkle star. Quadratic
          Bezier curves dip inward between cardinal points so the
          shape reads as a real star glyph, not a circle. The path's
          outer reach is OUTER (cardinal point radius); the inner
          concave valleys sit at INNER. Pairs with the spike rays
          beyond — the star's points sit just inside the rays' inner
          ends, so the rays read as light flares extending from the
          star's tips. */}
      <path
        d={SPARKLE_STAR_PATH}
        fill="var(--star-cream)"
        opacity={isPreview ? 0.55 : 1}
        data-twinkle-phase={twinkleDelay}
        className="constellation-star__body"
      />
      {/* Cross-burst spike rays — light flares extending from the
          star's cardinal points outward into the surrounding sky. */}
      <g className="constellation-star__spikes pointer-events-none" data-hue={hue}>
        <line x1={-22} y1={0} x2={22} y2={0} />
        <line x1={0} y1={-22} x2={0} y2={22} />
      </g>
      {/* Hit target — large enough for thumb taps on iPhone. */}
      <circle r={30} fill="transparent" className="constellation-star__hit" />
    </>
  );
}
