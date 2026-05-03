import { BACKGROUND_STARS } from '@/shared/content/backgroundStars';

// Decorative pinpricks of light filling the celestial sphere beyond
// the named works. Each star is a small cream-gold circle that the
// projector positions per RAF tick via the data-bg-id selector —
// same per-frame mutation pattern as the named-star wrapper groups,
// but with no link, no aria, no hover state. These stars carry no
// hypertext; they are the atmosphere of stars between the linked
// ones, the Hevelius-register "library of stars" read.
//
// The radius and opacity vary per star by its magnitude (a stable
// hash-derived value in [0.4, 0.8]), giving the field visual
// hierarchy. Atomic contract: zero state, zero effects, the only
// runtime mutation is the projector writing the wrapper group's
// transform attribute each tick.

export function BackgroundStarfield() {
  return (
    <g aria-hidden="true" className="constellation-bg-stars pointer-events-none">
      {BACKGROUND_STARS.map((star) => (
        <g key={star.id} data-bg-id={star.id} transform="translate(500 500)">
          <circle
            r={2 * star.magnitude}
            fill="var(--star-cream)"
            opacity={0.3 + star.magnitude * 0.4}
          />
        </g>
      ))}
    </g>
  );
}
