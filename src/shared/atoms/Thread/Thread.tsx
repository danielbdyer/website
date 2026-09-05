import type { Origin } from '@dbd/slice';
import type { ConstellationHue } from '@/shared/content/constellation';
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

/** How the thread is drawn. A stroke of an axis's figure carries the
 *  axis, its hue, and whether that figure is dotted; a relation the
 *  slice carries has no axis and is drawn in the page's ink. Origin
 *  decides the weight — declared solid, discovered dotted, emergent
 *  hairline — and the predicate is spoken by the whisper rather than
 *  drawn (CATHEDRALS.md §"Adjudications" 3). */
export interface ThreadStroke {
  readonly axis: string | null;
  readonly hue: ConstellationHue | null;
  readonly origin: Origin;
  readonly dotted: boolean;
}

/** The thread's place in the walk. `active`: an endpoint is hovered,
 *  focused, or stood at — the thread blooms. `walked`: the visitor
 *  has traveled along it this session — it keeps a little of the
 *  light. `lit`: its axis's whole figure is under attention (a
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
  stroke: ThreadStroke;
  /** Stable identifier (e.g. "garden/small-weather|study/note|relation")
   *  so the projector and the organism can address this thread. */
  id: string;
  walk?: ThreadWalk;
  className?: string;
}

const HUE_CSS_VAR: Record<ConstellationHue, string> = {
  warm: 'var(--accent-warm)',
  rose: 'var(--accent-rose)',
  violet: 'var(--accent-violet)',
  gold: 'var(--accent-gold)',
};

/** The page's quiet ink, for a relation that belongs to no axis. */
const INK = 'var(--text-3)';

/** Weights by origin, at rest and when active. A relation the author
 *  declared is a line; a figure the sky noticed is a hairline. */
const REST_WIDTH: Readonly<Record<Origin, number>> = {
  declared: 0.8,
  discovered: 0.6,
  emergent: 0.55,
};
const ACTIVE_WIDTH: Readonly<Record<Origin, number>> = {
  declared: 1.4,
  discovered: 1.1,
  emergent: 1.1,
};

/** The invisible stroke that lets a hairline be hovered and clicked.
 *  Wide enough to take with a pointer; the star's own hit target
 *  (r=12) paints above it, so a star always wins. Only a present
 *  thread carries one: a thread that has receded cannot be taken. */
const HIT_STROKE_WIDTH = 14;

// A thread between two stars. At rest it is barely visible — *the
// suggestion of a connection rather than its declaration*. In the walk
// a thread is also a path: hovering it lights it end to end, clicking
// it travels to its far end (CONSTELLATION_WALK.md §"Input"). The
// visible hairline stays pointer-inert; a wide transparent twin beneath
// the stars carries the hover and the click, and the projector moves
// both each frame.

export function Thread({ endpoints, stroke, id, walk = {}, className }: ThreadProps) {
  const { axis, hue, origin, dotted } = stroke;
  const { active = false, walked = false, lit = false, present = true } = walk;
  const geometry = { x1: endpoints.x1, y1: endpoints.y1, x2: endpoints.x2, y2: endpoints.y2 };
  return (
    <g
      data-thread={id}
      data-axis={axis ?? undefined}
      data-origin={origin}
      data-hue={hue ?? undefined}
      data-active={active ? 'true' : undefined}
      data-walked={walked ? 'true' : undefined}
      data-lit={lit ? 'true' : undefined}
      data-present={present ? 'true' : 'false'}
      aria-hidden="true"
      className={cn('constellation-thread-group', className)}
    >
      <line
        {...geometry}
        stroke={hue ? HUE_CSS_VAR[hue] : INK}
        strokeWidth={active ? ACTIVE_WIDTH[origin] : REST_WIDTH[origin]}
        strokeLinecap="round"
        strokeDasharray={dotted || origin === 'discovered' ? '2.4 3.6' : undefined}
        // The brushstroke filter (feTurbulence + feDisplacementMap)
        // re-runs per frame for every thread; held. Active threads
        // keep the vespers bloom — there are few at once.
        filter={active ? 'url(#cn-vespers-bloom)' : undefined}
        data-thread-id={id}
        className="constellation-thread pointer-events-none"
      />
      {present ? (
        <line
          {...geometry}
          stroke="transparent"
          strokeWidth={HIT_STROKE_WIDTH}
          strokeLinecap="round"
          data-thread-hit={id}
          className="constellation-thread__hit cursor-pointer"
        />
      ) : null}
    </g>
  );
}
