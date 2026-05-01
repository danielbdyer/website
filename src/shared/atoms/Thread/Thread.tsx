import type { ConstellationHue } from '@/shared/content/constellation';
import { cn } from '@/shared/utils/cn';

interface ThreadProps {
  /** Endpoints in the SVG's viewBox space. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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

export function Thread({ x1, y1, x2, y2, hue, id, active = false, className }: ThreadProps) {
  const colorVar = HUE_CSS_VAR[hue];
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={colorVar}
      strokeWidth={active ? 1.1 : 0.45}
      strokeLinecap="round"
      filter={active ? 'url(#cn-vespers-bloom)' : undefined}
      data-thread-id={id}
      data-hue={hue}
      data-active={active ? 'true' : undefined}
      aria-hidden="true"
      className={cn(
        'constellation-thread pointer-events-none transition-all duration-200 ease-out',
        active ? 'opacity-95' : 'opacity-25',
        className,
      )}
    />
  );
}
