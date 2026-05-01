// The constellation's painted background — *the sea-painted dome
// by day, paper-night by night.* A layered radial gradient (sky-glow
// at upper-mid, sky-zenith mid, sky-horizon at the rim) carries the
// firmament's color through the theme; a procedural feTurbulence
// grain layer sits over it, modulated by `--sky-grain-opacity` and
// `mix-blend-mode: soft-light` so the same noise reads as paper-water
// in daylight and stardust at night. The umber palette breathed up
// into a luminous expanse.
//
// CONSTELLATION.md §"Two Render Modes" describes the visual register;
// tokens.css §"Constellation sky" defines the per-theme tones. The
// gradient's center is offset upward (cy=42%) so the bottom edge
// blends into --bg — the sky meets the Foyer ground without a seam.

interface FirmamentProps {
  /** ViewBox extent — the rect fills the SVG canvas. */
  size: number;
  /** Stable id prefix so callers can layer multiple firmaments
   *  without filter / gradient collisions. Defaults to `firmament`. */
  idPrefix?: string;
}

export function Firmament({ size, idPrefix = 'firmament' }: FirmamentProps) {
  const gradientId = `${idPrefix}-bg`;
  const grainFilterId = `${idPrefix}-grain`;
  return (
    <>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="var(--sky-glow)" stopOpacity="1" />
          <stop offset="32%" stopColor="var(--sky-zenith)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--sky-horizon)" stopOpacity="1" />
        </radialGradient>
        {/* feTurbulence produces stable fractal noise — the seed
            is fixed so the grain doesn't shimmer between renders. */}
        <filter id={grainFilterId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="2" seed="7" />
        </filter>
      </defs>
      <rect x={0} y={0} width={size} height={size} fill={`url(#${gradientId})`} />
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        filter={`url(#${grainFilterId})`}
        style={{ opacity: 'var(--sky-grain-opacity)', mixBlendMode: 'soft-light' }}
      />
    </>
  );
}
