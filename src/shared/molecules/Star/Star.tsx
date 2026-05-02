import type { ConstellationHue } from '@/shared/content/constellation';
import { StarMark } from '@/shared/atoms/StarMark/StarMark';
import { cn } from '@/shared/utils/cn';

interface StarProps {
  /** The work's URL — `/sky/${room}/${slug}`. */
  href: string;
  /** Used as the anchor's accessible name. Typically
   *  `"{title} — {room}"` so screen readers hear the work and its
   *  neighborhood. */
  label: string;
  /** Visible label below the body when active or hovered. Italic
   *  serif, second-voice, no period — *the constellation's whisper
   *  of what this is.* Falls back to `label` if not provided. */
  visibleLabel?: string;
  /** Visual hue from the work's primary facet. */
  hue: ConstellationHue;
  /** Preview/draft works render quieter and add a "(preview)"
   *  hint to the accessible name so screen readers announce the
   *  surface honestly. */
  isPreview?: boolean;
  /** Animation-delay (in seconds) for the halo's twinkle keyframe. */
  twinkleDelay?: number;
  /** When true, the star is the cursor's settled basin (or hovered
   *  / focused). The CSS uses data-active on this anchor to drive
   *  the halo claim, the gold-as-attention overlay, and the
   *  whispered label's fade-in. */
  isActive?: boolean;
}

// The addressable star — a real `<a href>` anchor wrapping the
// visual `<StarMark>` atom and a whispered italic label.
//
// Molecule contract (REACT_NORTH_STAR.md §"Molecules"): composed
// from atoms + HTML primitives, no domain logic, no data fetching,
// no external effects, ≤7 props, ≤60 lines. Hover and basin-claim
// state is computed by the navigation hook and passed in via
// `isActive`; this molecule never owns it.
//
// CSS selectors target `.constellation-star[data-active='true']`
// to drive the halo crescendo and the label fade-in — see
// tokens.css §"Constellation".

export function Star({
  href,
  label,
  visibleLabel,
  hue,
  isPreview = false,
  twinkleDelay,
  isActive = false,
}: StarProps) {
  return (
    <a
      href={href}
      aria-label={isPreview ? `${label} (preview)` : label}
      className={cn(
        'constellation-star group focus-visible:outline-none',
        isPreview && 'constellation-star--preview',
      )}
      data-hue={hue}
      data-active={isActive ? 'true' : undefined}
    >
      <StarMark
        hue={hue}
        isPreview={isPreview}
        {...(twinkleDelay !== undefined ? { twinkleDelay } : {})}
      />
      {/* Whispered label — italic serif at meta size, second-voice,
          aria-hidden because the addressable name is on the anchor
          itself; this label is for sighted readers only. */}
      <text
        y={16}
        textAnchor="middle"
        aria-hidden="true"
        className="constellation-star__label pointer-events-none"
      >
        {visibleLabel ?? label}
      </text>
    </a>
  );
}
