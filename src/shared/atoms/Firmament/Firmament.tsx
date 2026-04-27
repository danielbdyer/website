// The constellation's painted background. A soft radial wash that
// gathers light at the polestar and feathers out toward the rim.
// Painted with a `radialGradient` referencing the umber palette so the
// firmament shifts with the theme (the same room, dimmed).
//
// CONSTELLATION.md §"Two Render Modes" describes the daylight and
// night feel; this atom carries the light gradient. A future commit
// may add a granular paper-texture overlay or per-room atmospheric
// tints; both ride on top of this same surface without changing
// what's rendered here.

interface FirmamentProps {
  /** ViewBox extent — the rect fills the SVG canvas. */
  size: number;
  /** Stable id so callers can layer multiple gradients without
   *  collision. Defaults to `firmament-bg`. */
  gradientId?: string;
}

export function Firmament({ size, gradientId = 'firmament-bg' }: FirmamentProps) {
  return (
    <>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="var(--bg-warm)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={size} height={size} fill={`url(#${gradientId})`} />
    </>
  );
}
