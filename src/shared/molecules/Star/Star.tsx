import type { ConstellationHue } from '@/shared/content/constellation';
import { StarMark } from '@/shared/atoms/StarMark/StarMark';
import { cn } from '@/shared/utils/cn';

/** What the star represents — the work's addressing + display
 *  attributes. The star *is* a work, rendered as a point of
 *  light; this shape is the work's side of that pairing. The
 *  parent (Stage) builds it from a RenderableNode. */
export interface StarWork {
  /** The work's URL — `/sky/${room}/${slug}`. */
  readonly href: string;
  /** The anchor's accessible name. Typically
   *  `"{title} — {room}"` so screen readers hear the work and
   *  its neighborhood. */
  readonly label: string;
  /** Visible label below the body when active or hovered.
   *  Italic serif, second-voice, no period. Falls back to
   *  `label` if not provided. */
  readonly visibleLabel?: string;
  /** Visual hue from the work's primary facet. */
  readonly hue: ConstellationHue;
  /** Preview/draft works render quieter and add a "(preview)"
   *  hint to the accessible name so screen readers announce the
   *  surface honestly. */
  readonly isPreview?: boolean;
}

interface StarProps {
  work: StarWork;
  /** Animation-delay (in seconds) for the halo's twinkle
   *  keyframe. Stable per slug, set by the organism so adjacent
   *  halos don't pulse in sync. */
  twinkleDelay?: number;
  /** When true, the star is the cursor's settled basin (or
   *  hovered / focused). CSS uses data-active on this anchor to
   *  drive the halo claim, the gold-as-attention overlay, and
   *  the whispered label's fade-in. */
  isActive?: boolean;
  /** Optional CSS view-transition name applied to the anchor.
   *  Stage builds this from the work's room+slug via
   *  `skyStarTransitionName` so a click into
   *  /sky/{room}/{slug} morphs this star into the WorkOverlay
   *  panel. Stage passes `undefined` for the star whose overlay
   *  is currently open — names must be unique per snapshot. */
  viewTransitionName?: string;
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

export function Star({ work, twinkleDelay, isActive = false, viewTransitionName }: StarProps) {
  const { href, label, visibleLabel, hue, isPreview = false } = work;
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
      style={viewTransitionName ? { viewTransitionName } : undefined}
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
