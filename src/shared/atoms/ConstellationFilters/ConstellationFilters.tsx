// Shared SVG filter primitives for the constellation surface.
// Mounted once at the organism level, inside the constellation SVG's
// <defs>. Stars reference `cn-watercolor-halo` for their soft pigment
// bleed; threads reference `cn-vespers-bloom` when active for the
// wispy pastel fan-out described in CONSTELLATION.md §"The Threads".
//
// Filters live here rather than per-atom because they are vocabulary
// shared across the surface, not the property of any single atom. The
// pattern mirrors how design tokens live in tokens.css rather than in
// each component: name the gesture once, reference it everywhere.
//
// IDs are namespaced under `cn-` (constellation) so a future second
// filter set on the same page (a per-room mini-sky, the strata layer's
// ghost-node filters) can coexist without collision.

export function ConstellationFilters() {
  return (
    <defs>
      {/* Watercolor halo — what a star's outer disc passes through to
          gain a soft pigment bleed. A short gaussian blur softens the
          edge; the displacement map adds organic, paper-water variance
          so the halo doesn't read as mathematically circular. The
          turbulence's seed is fixed so the bleed is stable across
          renders rather than shimmering. */}
      <filter id="cn-watercolor-halo" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" result="softened" />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.5"
          numOctaves="2"
          seed="3"
          result="noise"
        />
        <feDisplacementMap
          in="softened"
          in2="noise"
          scale="1.4"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* Brushstroke thread — the at-rest filter applied to every
          thread so connections read as *hand-drawn* rather than
          mathematically straight. CONSTELLATION_DESIGN.md
          §"Materials" commits to brushstroke threads (tapered,
          varied, hand-drawn quality) — and the audit named the
          current vector lines as drift from that promise. The
          filter is two passes: a subtle low-frequency turbulence
          map (slower wobble than the watercolor halo's, so the
          line doesn't shimmer) and a small displacement that
          nudges the stroke laterally by ~0.6 viewbox units. Light
          touch — the geometry stays legible; the *register*
          shifts toward paper. Active threads bypass this filter
          and use `cn-vespers-bloom` instead — bloom dominates,
          the brushstroke would compete with it. */}
      <filter id="cn-brushstroke-thread" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.18"
          numOctaves="2"
          seed="7"
          result="brushNoise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="brushNoise"
          scale="0.6"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* Vespers bloom — what a thread passes through when its endpoint
          star is hovered or focused. A wider gaussian blur, a brightness
          boost via color matrix to push the pastel toward luminescence,
          and a slight outward feMorphology dilate so the line gains
          presence rather than just opacity. The afterimage / fade-tail
          is the rect-level CSS transition (200ms), not the filter.
          When the thread is at rest the filter does not apply — the
          atom toggles `data-active` and CSS gates the filter. */}
      <filter id="cn-vespers-bloom" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="bloomed" />
        <feColorMatrix
          in="bloomed"
          type="matrix"
          values="1.15 0 0 0 0  0 1.15 0 0 0  0 0 1.15 0 0  0 0 0 1.4 0"
          result="brightened"
        />
        <feMerge>
          <feMergeNode in="brightened" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Polestar wash — a soft watercolor halo around the geometric
          figure at world center. CONSTELLATION_DESIGN.md
          §"Materials" + §"Aesthetic / Visual Tone" commit to
          *watercolor washes* in title regions and around the
          polestar; this is its first form. Renders as a radial
          gradient inside the SVG so it composes with the
          firmament's noise rather than sitting on top as chrome.
          The bleed extends ~150 viewbox units beyond the polestar
          figure (~200 short-edge), large enough to feel like the
          page receiving the figure rather than the figure being
          drawn on the page. */}
      <radialGradient id="cn-polestar-wash" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--accent-warm)" stopOpacity="0.18" />
        <stop offset="40%" stopColor="var(--accent-warm)" stopOpacity="0.08" />
        <stop offset="100%" stopColor="var(--accent-warm)" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}
