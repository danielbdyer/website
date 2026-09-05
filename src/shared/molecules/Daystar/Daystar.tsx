import { useRef, useState, type CSSProperties, type ReactElement, type RefObject } from 'react';
import { DaystarFace } from '@/shared/atoms/DaystarFace/DaystarFace';
import {
  CENTER,
  DISC_RADIUS,
  MOON_PROFILE,
  fourPointStar,
} from '@/shared/atoms/DaystarFace/faceGeometry';
import { useCrownPhase } from '@/shared/hooks/useCrownPhase';
import { useDaystarMagic } from '@/shared/hooks/useDaystarMagic';
import { STRAND_COUNT } from '@/shared/sky/scarfGeometry';
import { DAYSTAR_TRANSITION_NAME } from '@/shared/utils/view-transition-names';
import { cn } from '@/shared/utils/cn';

/** The hour the sky keeps, and the way to turn it. Passed down from
 *  the route, which owns the theme; the constellation itself never
 *  reads the store. */
export interface SkyHour {
  readonly current: 'day' | 'night';
  readonly turn: () => void;
}

interface DaystarProps {
  /** Given an hour, the daystar is a real button that turns it —
   *  the nav's toggle, ascended. Without one it is decorative. */
  hour?: SkyHour | undefined;
  className?: string;
}

// The daystar — sun by day, moon by night — seated on the page in the
// frame's upper right, the plate's corner emblem, and the hour's own
// toggle: click it and it turns like a coin, the sun going edge-on as
// the moon comes round the other side, a flare and sparks at the turn,
// while the sky changes its hour over its own 1.8s arc. Both faces
// render; CSS keyed off the html's .lt/.dk shows the hour's (no
// hydration flash) and drives the turn as a transition. Around the
// face a scarf of silk swoops in three dimensions — three strands in
// two empty slots here, behind and in front, that the lazily fetched
// magic (dom/daystarMagic.ts) fills once the page is idle; the silk's
// colors are the hour's (tokens.css: --silk-1…4). The wrapper
// carries the daystar view-transition name, so a look-up morphs the
// nav's glyph into this face on its way to the sky, and a return
// carries it back. CONSTELLATION.md §"The Sun and the Moon";
// CONSTELLATION_STORYBOARD.md §"Scene 12", §"Scene 13".

const SPARKS = Array.from({ length: 8 }, (_, k) => {
  const a = (k / 8) * Math.PI * 2 + 0.35;
  return { dx: Math.cos(a) * 74, dy: Math.sin(a) * 74, delay: k * 0.045 };
});

function sparkStyle(spark: (typeof SPARKS)[number]): CSSProperties {
  return {
    '--dx': `${spark.dx.toFixed(1)}px`,
    '--dy': `${spark.dy.toFixed(1)}px`,
    animationDelay: `${spark.delay}s`,
  } as CSSProperties;
}

function Magic() {
  return (
    <g className="daystar__magic">
      <circle cx={CENTER} cy={CENTER} r={66} className="daystar__flare" />
      {SPARKS.map((spark, i) => (
        <path
          key={i}
          d={fourPointStar(CENTER, CENTER, 7)}
          style={sparkStyle(spark)}
          className="daystar__spark"
        />
      ))}
    </g>
  );
}

const STRANDS = Array.from({ length: STRAND_COUNT }, (_, k) => k);

/** A slot for the scarf — its strands and the main strand's sheen —
 *  behind the face or in front of it. Empty until the magic mounts
 *  and writes the paths. */
function Scarf({ side }: { side: 'behind' | 'front' }) {
  return (
    <g className={cn('daystar__scarf', `daystar__scarf--${side}`)}>
      {STRANDS.map((k) => (
        <path key={k} d="" data-strand={k} className="daystar__scarf-body" />
      ))}
      <path d="" className="daystar__scarf-sheen" />
    </g>
  );
}

function stop(from: string, to: string, opacity: [number, number, number]): ReactElement[] {
  return [
    <stop key="a" offset="0" stopColor={from} stopOpacity={opacity[0]} />,
    <stop key="b" offset="0.55" stopColor={from} stopOpacity={opacity[1]} />,
    <stop key="c" offset="1" stopColor={to} stopOpacity={opacity[2]} />,
  ];
}

/** The light on the bodies — the sun's core and limb, the moon's
 *  earthshine and terminator — the dusk's flare, and the clips that
 *  keep the scarf's echoes to the body each lights or shadows. */
function LightDefs() {
  return (
    <>
      <radialGradient id="daystar-sun-core" cx="38%" cy="34%" r="62%">
        <stop offset="0" stopColor="var(--daystar-paper)" stopOpacity="0.55" />
        <stop offset="0.45" stopColor="var(--accent-gold)" stopOpacity="0.18" />
        <stop offset="1" stopColor="var(--accent-gold)" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="daystar-sun-limb">
        <stop offset="0.6" stopColor="var(--accent-warm)" stopOpacity="0" />
        <stop offset="0.88" stopColor="var(--accent-warm)" stopOpacity="0.32" />
        <stop offset="1" stopColor="var(--daystar-ink)" stopOpacity="0.5" />
      </radialGradient>
      <radialGradient id="daystar-earthshine" cx="58%" cy="48%" r="64%">
        <stop offset="0" stopColor="var(--daystar-paper)" stopOpacity="0.22" />
        <stop offset="0.7" stopColor="var(--daystar-paper)" stopOpacity="0.08" />
        <stop offset="1" stopColor="var(--accent-violet)" stopOpacity="0.14" />
      </radialGradient>
      <linearGradient id="daystar-moon-shade" x1="1" y1="0.2" x2="0" y2="0.8">
        <stop offset="0" stopColor="var(--accent-violet)" stopOpacity="0" />
        <stop offset="0.5" stopColor="var(--accent-violet)" stopOpacity="0.2" />
        <stop offset="1" stopColor="var(--daystar-ink)" stopOpacity="0.42" />
      </linearGradient>
      <radialGradient id="daystar-dusk">
        <stop offset="0" stopColor="var(--accent-gold)" stopOpacity="0.55" />
        <stop offset="0.45" stopColor="var(--accent-rose)" stopOpacity="0.4" />
        <stop offset="1" stopColor="var(--accent-violet)" stopOpacity="0" />
      </radialGradient>
      <clipPath id="daystar-disc-clip">
        <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} />
      </clipPath>
      <clipPath id="daystar-crescent-clip">
        <path d={MOON_PROFILE} />
      </clipPath>
    </>
  );
}

// The washes, as gradients — the discs, the light on them (the sun's
// core and limb, the moon's earthshine and terminator), the dusk's
// flare; two still filters — the halo's wet edge and the disc's grain;
// the wisp that softens the scarf where it passes behind; the clips
// that keep the scarf's echoes to the bodies they light or shadow;
// and the silk, whose colors the magic sweeps around.
function DaystarDefs() {
  return (
    <defs>
      <filter id="daystar-wash" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" />
        <feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation="1.1" />
      </filter>
      <filter id="daystar-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="2"
          seed="4"
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="matrix"
          values="0 0 0 0 0.17  0 0 0 0 0.13  0 0 0 0 0.1  0 0 0 0.9 0"
          result="ink"
        />
        <feComposite in="ink" in2="SourceGraphic" operator="in" />
      </filter>
      <filter id="daystar-wisp" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.8" />
      </filter>
      <radialGradient id="daystar-sun-halo">
        {stop('var(--accent-gold)', 'var(--accent-warm)', [0.34, 0.12, 0])}
      </radialGradient>
      <radialGradient id="daystar-moon-halo">
        {stop('var(--accent-violet)', 'var(--accent-rose)', [0.3, 0.1, 0])}
      </radialGradient>
      <radialGradient id="daystar-sun-disc" cx="40%" cy="36%" r="72%">
        <stop offset="0" stopColor="var(--accent-gold)" stopOpacity="0.55" />
        <stop offset="0.55" stopColor="var(--accent-gold)" stopOpacity="0.9" />
        <stop offset="1" stopColor="var(--accent-warm)" stopOpacity="0.95" />
      </radialGradient>
      <LightDefs />
      <radialGradient id="daystar-moon-disc" cx="42%" cy="38%" r="70%">
        <stop offset="0" stopColor="var(--daystar-paper)" stopOpacity="1" />
        <stop offset="0.72" stopColor="var(--daystar-paper)" stopOpacity="0.92" />
        <stop offset="1" stopColor="var(--accent-violet)" stopOpacity="0.45" />
      </radialGradient>
      <linearGradient id="daystar-ray" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="var(--accent-gold)" />
        <stop offset="1" stopColor="var(--accent-warm)" />
      </linearGradient>
      <linearGradient id="daystar-ray-wavy" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="var(--accent-warm)" />
        <stop offset="1" stopColor="var(--accent-gold)" />
      </linearGradient>
      <radialGradient id="daystar-blush">
        {stop('var(--accent-rose)', 'var(--accent-rose)', [0.85, 0.35, 0])}
      </radialGradient>
      <radialGradient id="daystar-flare">
        {stop('var(--accent-gold)', 'var(--accent-gold)', [0.8, 0.25, 0])}
      </radialGradient>
      <linearGradient
        id="daystar-silk"
        gradientUnits="userSpaceOnUse"
        x1="40"
        y1="40"
        x2="200"
        y2="200"
        spreadMethod="reflect"
      >
        <stop offset="0" stopColor="var(--silk-1)" />
        <stop offset="0.34" stopColor="var(--silk-2)" />
        <stop offset="0.66" stopColor="var(--silk-3)" />
        <stop offset="1" stopColor="var(--silk-4)" />
      </linearGradient>
    </defs>
  );
}

/** The daystar's three layers, all filling the seat: the scarf's
 *  behind slot; the body's canvas, which the magic paints as living
 *  pigment (empty until then — the drawn discs are the body); and the
 *  drawn faces with the scarf's front slot over them. The defs live in
 *  the front svg; url() references resolve across the document, so
 *  the behind slot's silk finds them too. */
function DaystarLayers({ turns }: { turns: number }) {
  return (
    <>
      <svg viewBox="0 0 240 240" aria-hidden="true" className="daystar__svg daystar__svg--behind">
        <Scarf side="behind" />
      </svg>
      <canvas width={240} height={240} aria-hidden="true" className="daystar__paint" />
      <svg viewBox="0 0 240 240" aria-hidden="true" className="daystar__svg daystar__svg--front">
        <DaystarDefs />
        <circle cx={CENTER} cy={CENTER} r={112} className="daystar__dusk" />
        <DaystarFace variant="sun" />
        <DaystarFace variant="moon" />
        <Scarf side="front" />
        {turns > 0 && <Magic key={turns} />}
      </svg>
    </>
  );
}

function label(hour: SkyHour): string {
  return hour.current === 'day' ? 'Turn the hour to night' : 'Turn the hour to day';
}

export function Daystar({ hour, className }: DaystarProps) {
  const [turns, setTurns] = useState(0);
  const rootRef = useRef<HTMLElement | null>(null);
  const magic = useDaystarMagic(rootRef);
  useCrownPhase(rootRef);
  const style = { viewTransitionName: DAYSTAR_TRANSITION_NAME };
  const attend = (on: boolean) => () => magic.current?.hover(on);
  if (!hour) {
    return (
      <div
        ref={rootRef as RefObject<HTMLDivElement | null>}
        data-daystar="true"
        aria-hidden="true"
        style={style}
        className={cn('daystar', className)}
        onPointerEnter={attend(true)}
        onPointerLeave={attend(false)}
      >
        <DaystarLayers turns={0} />
      </div>
    );
  }
  return (
    <button
      ref={rootRef as RefObject<HTMLButtonElement | null>}
      type="button"
      data-daystar="true"
      data-hour={hour.current}
      aria-label={label(hour)}
      style={style}
      className={cn('daystar', className)}
      onPointerEnter={attend(true)}
      onPointerLeave={attend(false)}
      onFocus={attend(true)}
      onBlur={attend(false)}
      onClick={() => {
        setTurns((n) => n + 1);
        magic.current?.turn();
        hour.turn();
      }}
    >
      <DaystarLayers turns={turns} />
    </button>
  );
}
