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

interface ThreadProps {
  endpoints: ThreadEndpoints;
  /** The thread's hue, derived from the facet that joins the two stars. */
  hue: ConstellationHue;
  /** Stable identifier (e.g. "garden/small-weather|study/note|relation")
   *  so the renderer can match a hover-bloom against the right thread. */
  id: string;
  /** When true, the thread blooms — wider stroke, vespers filter
   *  applied, opacity raised. The molecule sets this when one of the
   *  thread's endpoints is hovered or focused. */
  active?: boolean;
  className?: string;
}

const HUE_CSS_VAR: Record<ConstellationHue, string> = {
  warm: 'var(--accent-warm)',
  rose: 'var(--accent-rose)',
  violet: 'var(--accent-violet)',
  gold: 'var(--accent-gold)',
};

// A faint connection between two stars in the constellation. At rest
// it is barely visible — *the suggestion of a connection rather than
// its declaration*. Hover state lives at the molecule level (the
// constellation organism toggles a `data-bloom` attribute on threads
// connected to a hovered star); this atom carries the bones the
// molecule paints.
//
// `pointer-events: none` on the line means the thread does not
// capture clicks — only the stars are addressable. Threads carry
// information; stars carry navigation. CONSTELLATION.md §"Interaction
// Vocabulary" makes this distinction explicit.

export function Thread({ endpoints, hue, id, active = false, className }: ThreadProps) {
  // Stroke is always the gold-cream thread warmth (the Hevelius
  // register's constellation-line color); the facet hue still
  // travels via data-hue so a future highlighting pass can lift
  // it without rewiring the atom. At rest threads are visible —
  // CONSTELLATION_DESIGN.md §"The Threads" calls them wisps; the
  // first form rendered them invisibly until hover, which made the
  // sky read as disconnected points rather than a constellation.
  return (
    <line
      x1={endpoints.x1}
      y1={endpoints.y1}
      x2={endpoints.x2}
      y2={endpoints.y2}
      stroke="var(--thread-warmth)"
      strokeWidth={active ? 1.2 : 0.55}
      strokeLinecap="round"
      // The brushstroke filter is held — feTurbulence inside the
      // rotating group re-runs the rasterizer for every thread every
      // frame at ~270ms idle for 70 threads. The held intent
      // (paint-grain on threads at rest) returns via deterministic
      // wobbly geometry or a per-thread stroke pattern. Active
      // threads keep the vespers bloom — there are at most 1–2 at once.
      filter={active ? 'url(#cn-vespers-bloom)' : undefined}
      data-thread-id={id}
      data-hue={hue}
      data-active={active ? 'true' : undefined}
      aria-hidden="true"
      // At rest: invisible. The constellation reads as scattered
      // points of light, not as a graph diagram. The held intent
      // (visible-at-rest connection lines per the design doc's
      // "wisps" register) was making the surface feel like a
      // wireframe-globe. Threads stay in the DOM so the hover
      // bloom can still light them briefly when a star is focused
      // — connection becomes a found thing, not a declared one.
      className={cn(
        'constellation-thread pointer-events-none',
        active ? 'opacity-95' : 'opacity-0',
        className,
      )}
    />
  );
}

// Imported but no longer referenced inside the component — the stroke
// is read directly from the --thread-warmth token. Kept around because
// removing the type-erasure of the union value is not free and the
// static map is still informative documentation of what each facet
// could mean here. If a future highlight pass needs it, the lookup
// is one line away.
void HUE_CSS_VAR;
