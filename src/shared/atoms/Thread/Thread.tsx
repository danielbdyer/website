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
  // At rest: a quiet dotted thread (dasharray "1 4") at low opacity
  // — barely visible, but present, so the constellation reads as a
  // constellation rather than as scattered unrelated points. The
  // Hevelius reference plates carry exactly this register: faint
  // gold-cream connecting lines that you read once you look closely.
  //
  // When active: a longer-dashed stitched stroke softened by the
  // vespers-bloom filter so the line reads as a wisp of light. The
  // dashes blur into a continuous-but-soft glow under the bloom;
  // without the bloom they read as a stitched thread; together they
  // read as both — a thread of light.
  return (
    <line
      x1={endpoints.x1}
      y1={endpoints.y1}
      x2={endpoints.x2}
      y2={endpoints.y2}
      stroke="var(--thread-warmth)"
      strokeWidth={active ? 1.4 : 0.45}
      strokeLinecap="round"
      strokeDasharray={active ? '3 5' : '1 4'}
      filter={active ? 'url(#cn-vespers-bloom)' : undefined}
      data-thread-id={id}
      data-hue={hue}
      data-active={active ? 'true' : undefined}
      aria-hidden="true"
      className={cn(
        'constellation-thread pointer-events-none',
        active ? 'opacity-70' : 'opacity-15',
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
