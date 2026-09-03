import type { ConstellationHue } from '@/shared/content/constellation';
import type { Facet } from '@/shared/types/common';
import { cn } from '@/shared/utils/cn';

/** Endpoints in the SVG's viewBox space. Bundled so the atom's
 *  prop count stays inside the ≤5 ceiling REACT_NORTH_STAR.md
 *  asks of atoms — geometry is one cohesive concern, not four. */
export interface ThreadEndpoints {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** The figure this thread is a stroke of: the facet, and its hue. */
export interface ThreadFigure {
  readonly facet: Facet;
  readonly hue: ConstellationHue;
}

/** The thread's place in the walk. `active`: an endpoint is hovered,
 *  focused, or stood at — the thread blooms. `walked`: the visitor
 *  has traveled along it this session — it keeps a little of the
 *  light. `lit`: its facet's whole figure is under attention (a
 *  hovered bearing or sibling thread). `present`: both ends are
 *  present from where the visitor stands; otherwise it recedes. */
export interface ThreadWalk {
  readonly active?: boolean;
  readonly walked?: boolean;
  readonly lit?: boolean;
  readonly present?: boolean;
}

interface ThreadProps {
  endpoints: ThreadEndpoints;
  figure: ThreadFigure;
  /** Stable identifier (e.g. "garden/small-weather|study/note|relation")
   *  so the projector and the organism can address this thread. */
  id: string;
  walk?: ThreadWalk;
  className?: string;
}

// Adjacent facets share a hue (FACET_HUE), so within each pair the
// second draws its figure in a dotted hairline — the way an atlas
// distinguishes two systems of lines in one ink — and the eight
// figures stay tellable apart.
const DOTTED_FACETS: ReadonlySet<Facet> = new Set(['body', 'language', 'becoming', 'relation']);

const HUE_CSS_VAR: Record<ConstellationHue, string> = {
  warm: 'var(--accent-warm)',
  rose: 'var(--accent-rose)',
  violet: 'var(--accent-violet)',
  gold: 'var(--accent-gold)',
};

/** The invisible stroke that lets a hairline be hovered and clicked.
 *  Wide enough to take with a pointer; the star's own hit target
 *  (r=12) paints above it, so a star always wins. */
const HIT_STROKE_WIDTH = 14;

// A stroke of a facet's figure between two stars. At rest it is
// barely visible — *the suggestion of a connection rather than its
// declaration*. In the walk a thread is also a path: hovering it
// lights it end to end, clicking it travels to its far end
// (CONSTELLATION_WALK.md §"Input"). The visible hairline stays
// pointer-inert; a wide transparent twin beneath the stars carries
// the hover and the click, and the projector moves both each frame.

export function Thread({ endpoints, figure, id, walk = {}, className }: ThreadProps) {
  const { facet, hue } = figure;
  const { active = false, walked = false, lit = false, present = true } = walk;
  const geometry = { x1: endpoints.x1, y1: endpoints.y1, x2: endpoints.x2, y2: endpoints.y2 };
  return (
    <g
      data-thread={id}
      data-facet={facet}
      data-hue={hue}
      data-active={active ? 'true' : undefined}
      data-walked={walked ? 'true' : undefined}
      data-lit={lit ? 'true' : undefined}
      data-present={present ? 'true' : 'false'}
      aria-hidden="true"
      className={cn('constellation-thread-group', className)}
    >
      <line
        {...geometry}
        stroke={HUE_CSS_VAR[hue]}
        strokeWidth={active ? 1.1 : 0.55}
        strokeLinecap="round"
        strokeDasharray={DOTTED_FACETS.has(facet) ? '2.4 3.6' : undefined}
        // The brushstroke filter (feTurbulence + feDisplacementMap)
        // re-runs per frame for every thread; held. Active threads
        // keep the vespers bloom — there are few at once.
        filter={active ? 'url(#cn-vespers-bloom)' : undefined}
        data-thread-id={id}
        className="constellation-thread pointer-events-none"
      />
      <line
        {...geometry}
        stroke="transparent"
        strokeWidth={HIT_STROKE_WIDTH}
        strokeLinecap="round"
        data-thread-hit={id}
        className="constellation-thread__hit cursor-pointer"
      />
    </g>
  );
}
