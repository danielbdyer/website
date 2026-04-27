import type { ConstellationHue } from '@/shared/content/constellation';
import { cn } from '@/shared/utils/cn';

interface StarProps {
  /** The work's URL — `/${room}/${slug}`. */
  href: string;
  /** Used as accessible name and the on-hover label. */
  label: string;
  /** Cartesian position in the SVG's viewBox space. */
  cx: number;
  cy: number;
  /** Visual hue from the work's primary facet. */
  hue: ConstellationHue;
  /** Preview/draft works render quieter and carry a different aria
   *  hint so a screen reader can announce the surface honestly. */
  isPreview?: boolean;
  /** Optional className for layout-level adjustments by the parent. */
  className?: string;
}

const HUE_CSS_VAR: Record<ConstellationHue, string> = {
  warm: 'var(--accent-warm)',
  rose: 'var(--accent-rose)',
  violet: 'var(--accent-violet)',
  gold: 'var(--accent-gold)',
};

// A single work, rendered as a small bloom of pigment in the
// firmament. The structural layer of the constellation: a real
// addressable anchor, focusable by keyboard, announced as a link to
// screen readers, paintable by the renderer in either daylight
// (watercolor bleed) or night (star with halo) modes via CSS class
// hooks. CONSTELLATION.md §"Two Render Modes" describes the visual
// register; this atom carries the bones the modes paint.
//
// The atom has zero motion of its own. Hover behavior — thread
// blooms, label reveal — lives at the molecule level so the atom
// stays a leaf with clean inputs and no internal state.

export function Star({ href, label, cx, cy, hue, isPreview = false, className }: StarProps) {
  const colorVar = HUE_CSS_VAR[hue];
  return (
    <a
      href={href}
      aria-label={isPreview ? `${label} (preview)` : label}
      className={cn(
        'constellation-star group focus-visible:outline-none',
        isPreview && 'constellation-star--preview',
        className,
      )}
      data-hue={hue}
    >
      {/* The halo: a soft outer disc that catches the eye without
          announcing itself. Painted by the parent surface's CSS — by
          day it is a watercolor bleed, by night a soft glow. */}
      <circle
        cx={cx}
        cy={cy}
        r={4.6}
        fill={colorVar}
        opacity={0.18}
        className="constellation-star__halo pointer-events-none"
      />
      {/* The body: the addressable point. Slightly smaller than the
          halo, more saturated, the visitor's actual target. */}
      <circle
        cx={cx}
        cy={cy}
        r={1.8}
        fill={colorVar}
        opacity={isPreview ? 0.55 : 1}
        className="constellation-star__body"
      />
      {/* A larger transparent hit circle so the click and focus
          targets are at least 24px effective diameter regardless of
          the visual halo size — comfortable for pointer and touch. */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" className="constellation-star__hit" />
    </a>
  );
}
