import { cn } from '@/shared/utils/cn';
import { CENTER, DISC_PATH, DISC_RADIUS, MOON_PROFILE, RAYS, fourPointStar } from './faceGeometry';

export type DaystarVariant = 'sun' | 'moon';

interface DaystarFaceProps {
  variant: DaystarVariant;
}

// The hour's face, in the engraver's register — the sun in splendour
// on an astronomical clock's dial, the sleeping moon in profile at its
// shoulder — rather than a card's laughing Santa. Serene, a little
// knowing. The sun: a crown of sixteen rays, straight and wavy by
// turns, on the slowest clock; thin arched brows; almond eyes with a
// lid line and a lash line; a single line of a nose with a small hook;
// a closed smile; faint cheeks; the dial's fine rings inside the rim;
// watercolor granulation over the gold. The moon: the whole disc's
// earthshine, faint; the crescent in profile, asleep, with a closed
// eye and a cheek; freckles of crater; three small stars in the dark.
//
// The light (the fourth pass): the faces are lit bodies, not stickers.
// The sun is its own light — a core that brightens toward the upper
// left, a limb that darkens and warms toward the rim — and the silk
// that crosses it is backlit, a paper glow where the strand passes
// over the disc. The moon is lit from the right, where its outer rim
// is: a terminator shades the crescent toward the profile, the
// earthshine is a dim wash, and the silk that crosses it casts a soft
// shadow on the lit body. The two echoes of the scarf (backlit, cast)
// are paths the magic writes alongside the front strand.
//
// Every wash is a gradient, so the face can breathe, blink, and follow
// the pointer cheaply; the filters are still ones — the halo's wet
// edge and the grain. The molecule (Daystar) frames the two faces,
// turns them, and gives them their button. CONSTELLATION.md §"The
// Sun and the Moon". Geometry lives in faceGeometry.ts; colors in
// tokens.css §"The daystar", keyed by class.

function Crown() {
  return (
    <g className="daystar__rays">
      {RAYS.map((ray) => (
        <path
          key={ray.angle}
          d={ray.d}
          transform={`rotate(${ray.angle} ${CENTER} ${CENTER})`}
          className={cn('daystar__ray', `daystar__ray--${ray.kind}`)}
        />
      ))}
    </g>
  );
}

/** The dial's fine circles inside the rim. */
function Rings({ radii }: { radii: readonly number[] }) {
  return (
    <>
      {radii.map((r) => (
        <circle key={r} cx={CENTER} cy={CENTER} r={r} className="daystar__ring" />
      ))}
    </>
  );
}

/** Watercolor granulation over the disc: noise, clipped to the disc,
 *  laid on as pigment (the filter is still, so it costs nothing). */
function Grain() {
  return (
    <circle
      cx={CENTER}
      cy={CENTER}
      r={DISC_RADIUS}
      filter="url(#daystar-grain)"
      className="daystar__grain"
    />
  );
}

interface EyeProps {
  x: number;
  y: number;
}

// An almond eye drawn the engraver's way: the white; the gaze — iris,
// pupil, glint — which slides toward the pointer; a lid line above and
// a lash line below. The whole eye blinks by squinting to a line (CSS).
function Eye({ x, y }: EyeProps) {
  return (
    <g transform={`translate(${x} ${y})`} className="daystar__eye">
      <path d="M -8.5 0 Q 0 -6.4 8.5 0 Q 0 5.6 -8.5 0 Z" className="daystar__eye-white" />
      <g className="daystar__gaze">
        <circle r={3.9} className="daystar__iris" />
        <circle r={1.9} className="daystar__pupil" />
        <circle cx={-1.3} cy={-1.3} r={1.2} className="daystar__glint" />
      </g>
      <path d="M -8.5 0 Q 0 -6.4 8.5 0" className="daystar__lid" />
      <path d="M -7 1.5 Q 0 5.6 7 1.5" className="daystar__lash" />
    </g>
  );
}

// The sun's face: serene, a little amused.
function SunFeatures() {
  return (
    <g className="daystar__face">
      <ellipse cx={90} cy={131} rx={11} ry={8} className="daystar__cheek" />
      <ellipse cx={150} cy={131} rx={11} ry={8} className="daystar__cheek" />
      <path d="M 86 96 Q 100 87.5 114 95" className="daystar__brow" />
      <path d="M 154 96 Q 140 87.5 126 95" className="daystar__brow" />
      <Eye x={101} y={107} />
      <Eye x={139} y={107} />
      <path d="M 120 101 L 117.5 122 Q 119.5 126.5 124 123.5" className="daystar__nose" />
      <path d="M 106 143 Q 120 152 134 143" className="daystar__lip" />
      <path d="M 111 148 Q 120 151.5 129 148" className="daystar__lip daystar__lip--under" />
    </g>
  );
}

const CRATERS = [
  { x: 156, y: 90, r: 4.2 },
  { x: 163, y: 126, r: 3 },
  { x: 150, y: 158, r: 3.6 },
  { x: 146, y: 74, r: 2.2 },
] as const;

const MOON_STARS = [
  { x: 84, y: 96, r: 4.4, delay: 0 },
  { x: 77, y: 130, r: 3.2, delay: 1.3 },
  { x: 94, y: 158, r: 2.6, delay: 2.4 },
] as const;

// The moon's face: the crescent asleep in profile, lit from the right
// and shaded toward the profile, the silk's shadow falling across it;
// its eye closed, a cheek, the corner of a smile; the freckles on the
// lit body; the stars in the hollow's dark.
function MoonFeatures() {
  return (
    <g className="daystar__face">
      <path d={MOON_PROFILE} className="daystar__crescent" />
      <path d={MOON_PROFILE} className="daystar__terminator" />
      <g transform="translate(3 4)">
        <ScarfEcho className="daystar__cast" clip="daystar-crescent-clip" />
      </g>
      <ellipse cx={147} cy={118} rx={5.5} ry={4.2} className="daystar__cheek" />
      <path d="M 138 100 Q 143 103 148 100" className="daystar__lid" />
      <path d="M 138.6 100.8 Q 140.4 102.6 139.4 104.4" className="daystar__lash" />
      <path d="M 135 129 Q 137.5 130.8 139.5 129" className="daystar__lip" />
      {CRATERS.map((c) => (
        <circle key={`${c.x}-${c.y}`} cx={c.x} cy={c.y} r={c.r} className="daystar__crater" />
      ))}
      {MOON_STARS.map((s) => (
        <path
          key={`${s.x}-${s.y}`}
          d={fourPointStar(s.x, s.y, s.r)}
          style={{ animationDelay: `${s.delay}s` }}
          className="daystar__star"
        />
      ))}
    </g>
  );
}

/** An echo of the scarf's main front strand — the magic writes the
 *  same path here each frame — clipped to a body and styled by class:
 *  the sun's backlit silk, the moon's cast shadow. Empty until then. */
function ScarfEcho({ className, clip }: { className: string; clip: string }) {
  return <path d="" data-scarf-echo="front-0" clipPath={`url(#${clip})`} className={className} />;
}

function SunBody() {
  return (
    <g className="daystar__body">
      <path d={DISC_PATH} className="daystar__disc" />
      <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} className="daystar__core" />
      <SunFeatures />
      <Grain />
      <ScarfEcho className="daystar__backlit" clip="daystar-disc-clip" />
      <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} className="daystar__limb" />
      <Rings radii={[55, 51]} />
    </g>
  );
}

function MoonBody() {
  return (
    <g className="daystar__body">
      <path d={DISC_PATH} className="daystar__disc" />
      <MoonFeatures />
      <Grain />
      <Rings radii={[56]} />
    </g>
  );
}

export function DaystarFace({ variant }: DaystarFaceProps) {
  return (
    <g className={cn('daystar__hour', `daystar__${variant}`)}>
      <circle cx={CENTER} cy={CENTER} r={100} className="daystar__halo" />
      {variant === 'sun' && <Crown />}
      {variant === 'sun' ? <SunBody /> : <MoonBody />}
    </g>
  );
}
