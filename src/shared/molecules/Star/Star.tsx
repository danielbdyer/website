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
  /** Visible label below the body when named, active, or hovered.
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

/** The star's place in the walk (CONSTELLATION_WALK.md). `active`:
 *  hovered or focused — the halo claims. `here`: the visitor stands
 *  at it. `named`: within one stroke of here, so its label shows at
 *  rest. `visited`: stood at earlier this session — it keeps a
 *  little warmth. All are CSS hooks via data attributes. */
export interface StarWalk {
  readonly active?: boolean;
  readonly here?: boolean;
  readonly named?: boolean;
  readonly visited?: boolean;
}

interface StarProps {
  work: StarWork;
  /** Animation-delay (in seconds) for the halo's twinkle
   *  keyframe. Stable per slug, set by the organism so adjacent
   *  halos don't pulse in sync. */
  twinkleDelay?: number;
  walk?: StarWalk;
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
// no external effects, ≤7 props, ≤60 lines. Its place in the walk is
// computed by the organism and passed in via `walk`; this molecule
// never owns it. CSS selectors target the data attributes — see
// tokens.css §"Constellation".

export function Star({ work, twinkleDelay, walk = {}, viewTransitionName }: StarProps) {
  const { href, label, visibleLabel, hue, isPreview = false } = work;
  const { active = false, here = false, named = false, visited = false } = walk;
  return (
    <a
      href={href}
      aria-label={isPreview ? `${label} (preview)` : label}
      aria-current={here ? 'location' : undefined}
      className={cn(
        'constellation-star group focus-visible:outline-none',
        isPreview && 'constellation-star--preview',
      )}
      data-hue={hue}
      data-active={active ? 'true' : undefined}
      data-here={here ? 'true' : undefined}
      data-named={named ? 'true' : undefined}
      data-visited={visited ? 'true' : undefined}
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
