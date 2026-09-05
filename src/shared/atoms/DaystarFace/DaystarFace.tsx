import { cn } from '@/shared/utils/cn';
import { CENTER, DISC_PATH, RAYS, fourPointStar } from './faceGeometry';

export type DaystarVariant = 'sun' | 'moon';

interface DaystarFaceProps {
  variant: DaystarVariant;
}

// The hour's face — the sun by day, the moon by night — drawn the way
// a 1930s picture book draws a face: plump and rosy, a bulb of a nose
// with its highlight, bright eyes under arched brows, a jovial mouth.
// The sun wears a crown of hand-cut flame rays that turns on the
// slowest clock; the moon keeps its lit limb, a few freckles of crater,
// three small stars, and heavier lids. Every wash is a gradient, not a
// filter, so the face can breathe, blink, and follow the pointer
// cheaply; the one filter sits on the still halo behind it. The
// molecule (Daystar) frames the two faces, sizes them, turns them, and
// gives them their button. CONSTELLATION.md §"The Sun and the Moon".
//
// Geometry lives in faceGeometry.ts; colors live in CSS (tokens.css
// §"The daystar"), keyed by class.

function Crown() {
  return (
    <g className="daystar__rays">
      {RAYS.map((ray) => (
        <path
          key={ray.angle}
          d={ray.d}
          transform={`rotate(${ray.angle} ${CENTER} ${CENTER})`}
          className="daystar__ray"
        />
      ))}
    </g>
  );
}

const CRATERS = [
  { x: 96, y: 88, r: 5 },
  { x: 146, y: 78, r: 3.4 },
  { x: 156, y: 150, r: 4.2 },
  { x: 84, y: 160, r: 2.8 },
] as const;

const MOON_STARS = [
  { x: 176, y: 58, r: 5, delay: 0 },
  { x: 62, y: 66, r: 3.6, delay: 1.3 },
  { x: 188, y: 104, r: 3, delay: 2.4 },
] as const;

// The lit limb, the freckles, and three small stars that keep the
// moon company.
function MoonMarks() {
  return (
    <>
      <path d="M 150 72 A 60 60 0 0 1 150 168 A 44 60 0 0 0 150 72 Z" className="daystar__limb" />
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
    </>
  );
}

interface EyeProps {
  x: number;
  y: number;
  sleepy: boolean;
}

// An eye: the white, then the gaze — iris, pupil, glint — which slides
// toward the pointer; and for the moon a heavy lid. The whole eye
// blinks by squinting to a line (CSS).
function Eye({ x, y, sleepy }: EyeProps) {
  return (
    <g transform={`translate(${x} ${y})`} className="daystar__eye">
      <ellipse rx={8.5} ry={sleepy ? 5.6 : 6.4} className="daystar__eye-white" />
      <g className="daystar__gaze">
        <circle r={4.6} className="daystar__iris" />
        <circle r={2.4} className="daystar__pupil" />
        <circle cx={-1.7} cy={-1.7} r={1.6} className="daystar__glint" />
      </g>
      {sleepy && <ellipse cy={-3.4} rx={9.2} ry={6} className="daystar__lid" />}
    </g>
  );
}

function Features({ variant }: DaystarFaceProps) {
  const sleepy = variant === 'moon';
  return (
    <g className="daystar__face">
      <ellipse cx={88} cy={134} rx={16} ry={10.5} className="daystar__cheek" />
      <ellipse cx={152} cy={134} rx={16} ry={10.5} className="daystar__cheek" />
      <path d="M 90 96 Q 100 86 111 94" className="daystar__brow" />
      <path d="M 150 96 Q 140 86 129 94" className="daystar__brow" />
      <Eye x={101} y={108} sleepy={sleepy} />
      <Eye x={139} y={108} sleepy={sleepy} />
      <circle cx={120} cy={125} r={8.5} className="daystar__nose" />
      <circle cx={117} cy={122} r={2.6} className="daystar__glint" />
      {sleepy ? (
        <path d="M 103 147 Q 120 158 137 147" className="daystar__lip" />
      ) : (
        <>
          <path d="M 100 145 Q 120 166 140 145 Q 120 152 100 145 Z" className="daystar__mouth" />
          <path d="M 100 145 Q 120 166 140 145" className="daystar__lip" />
        </>
      )}
    </g>
  );
}

export function DaystarFace({ variant }: DaystarFaceProps) {
  return (
    <g className={cn('daystar__hour', `daystar__${variant}`)}>
      <circle cx={CENTER} cy={CENTER} r={100} className="daystar__halo" />
      {variant === 'sun' && <Crown />}
      <g className="daystar__body">
        <path d={DISC_PATH} className="daystar__disc" />
        {variant === 'moon' && <MoonMarks />}
        <Features variant={variant} />
      </g>
    </g>
  );
}
