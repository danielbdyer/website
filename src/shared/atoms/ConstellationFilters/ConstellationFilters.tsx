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
    </defs>
  );
}
