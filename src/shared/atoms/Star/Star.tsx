import type { ConstellationHue } from '@/shared/content/constellation';
import { cn } from '@/shared/utils/cn';

interface StarProps {
  /** The work's URL — `/${room}/${slug}`. */
  href: string;
  /** Used as accessible name and the on-hover label. */
  label: string;
  /** Visible label below the body when active or hovered. Italic
   *  serif, second-voice, no period — *the constellation's whisper
   *  of what this is.* Falls back to `label` if not provided. */
  visibleLabel?: string;
  /** Cartesian position in the SVG's viewBox space. */
  cx: number;
  cy: number;
  /** Visual hue from the work's primary facet. */
  hue: ConstellationHue;
  /** Preview/draft works render quieter and carry a different aria
   *  hint so a screen reader can announce the surface honestly. */
  isPreview?: boolean;
  /** Animation-delay (in seconds) for the halo's twinkle keyframe.
   *  Stable per slug, set by the organism from
   *  ConstellationNode.twinklePhase so adjacent stars don't pulse in
   *  sync. Reduced-motion is honored globally; the delay is harmless
   *  when the animation is paused. */
  twinkleDelay?: number;
  /** When true, the star is the cursor's settled basin (or hovered
   *  / focused). The halo crescendos, the gold-as-attention overlay
   *  rises, and the visible label appears. The design doc names this
   *  as the *halo claim* visual cue — *the room becoming attentive
   *  to you.* */
  isActive?: boolean;
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

export function Star({
  href,
  label,
  visibleLabel,
  cx,
  cy,
  hue,
  isPreview = false,
  twinkleDelay,
  isActive = false,
  className,
}: StarProps) {
  const colorVar = HUE_CSS_VAR[hue];
  const haloStyle = twinkleDelay !== undefined ? { animationDelay: `${twinkleDelay}s` } : undefined;
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
      data-active={isActive ? 'true' : undefined}
    >
      {/* The halo: a soft outer disc that catches the eye without
          announcing itself. Passes through the watercolor-halo
          filter (defined once per constellation in
          ConstellationFilters) so the edge bleeds with paper-water
          variance rather than rendering as a mathematically circular
          disc. By day this reads as a watercolor pigment bleed;
          by night, as a soft glow with organic edge — same filter,
          two registers, the theme handles the difference. CSS
          on [data-active="true"] crescendos the halo's radius and
          opacity over ~400ms — the design's named *halo claim*. */}
      <circle
        cx={cx}
        cy={cy}
        r={4.6}
        fill={colorVar}
        filter="url(#cn-watercolor-halo)"
        style={haloStyle}
        className="constellation-star__halo pointer-events-none"
      />
      {/* Gold halo overlay — the language of attention given.
          CONSTELLATION_DESIGN.md §"Light as Medium": *gold marks
          attention; facet hues mark category.* Invisible at rest;
          rises to a soft outer ring when the cursor settles into
          this star's well. Sized just outside the facet halo so it
          reads as a ring around — not a replacement of — the
          star's category color. */}
      <circle
        cx={cx}
        cy={cy}
        r={6.2}
        fill="var(--accent-gold)"
        filter="url(#cn-watercolor-halo)"
        className="constellation-star__gold pointer-events-none"
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
      {/* The whispered label. Italic serif, second-voice, low
          opacity — *the constellation's quiet naming of what you've
          settled on.* Hidden at rest; fades in when the basin
          claims. aria-hidden because the addressable name is on
          the anchor itself; this label is for sighted readers only. */}
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        aria-hidden="true"
        className="constellation-star__label pointer-events-none"
      >
        {visibleLabel ?? label}
      </text>
    </a>
  );
}
