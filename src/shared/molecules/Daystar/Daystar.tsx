import { useState, type CSSProperties, type ReactElement } from 'react';
import { DaystarFace } from '@/shared/atoms/DaystarFace/DaystarFace';
import { CENTER, fourPointStar } from '@/shared/atoms/DaystarFace/faceGeometry';
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
// frame's upper right, the plate's corner emblem, and since this pass
// the hour's own toggle: click it and it turns like a coin, the sun
// going edge-on as the moon comes round the other side, a burst of
// sparks at the turn, while the sky changes its hour over its own
// 1.8s arc. Both faces render; CSS keyed off the html's .lt/.dk shows
// the hour's (no hydration flash), and drives the turn as a transition
// so the two never overlap as an eclipse. The magic mounts fresh on
// every turn (a keyed group) and plays itself out. The wrapper carries
// the daystar view-transition name, so a look-up from a room morphs the
// nav's small glyph into this face on its way to the sky, and a return
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

function stop(from: string, to: string, opacity: [number, number, number]): ReactElement[] {
  return [
    <stop key="a" offset="0" stopColor={from} stopOpacity={opacity[0]} />,
    <stop key="b" offset="0.55" stopColor={from} stopOpacity={opacity[1]} />,
    <stop key="c" offset="1" stopColor={to} stopOpacity={opacity[2]} />,
  ];
}

// The washes: gradients, so the face costs nothing to animate; one
// gentle displacement filter for the halo's wet edge.
function DaystarDefs() {
  return (
    <defs>
      <filter id="daystar-wash" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" />
        <feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation="1.1" />
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
      <radialGradient id="daystar-moon-disc" cx="42%" cy="38%" r="70%">
        <stop offset="0" stopColor="var(--daystar-paper)" stopOpacity="1" />
        <stop offset="0.72" stopColor="var(--daystar-paper)" stopOpacity="0.92" />
        <stop offset="1" stopColor="var(--accent-violet)" stopOpacity="0.45" />
      </radialGradient>
      <linearGradient id="daystar-ray" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="var(--accent-gold)" />
        <stop offset="1" stopColor="var(--accent-warm)" />
      </linearGradient>
      <radialGradient id="daystar-blush">
        {stop('var(--accent-rose)', 'var(--accent-rose)', [0.85, 0.35, 0])}
      </radialGradient>
      <radialGradient id="daystar-nose" cx="40%" cy="35%" r="70%">
        <stop offset="0" stopColor="var(--accent-rose)" stopOpacity="0.55" />
        <stop offset="1" stopColor="var(--accent-warm)" stopOpacity="0.92" />
      </radialGradient>
      <radialGradient id="daystar-flare">
        {stop('var(--accent-gold)', 'var(--accent-gold)', [0.8, 0.25, 0])}
      </radialGradient>
    </defs>
  );
}

function label(hour: SkyHour): string {
  return hour.current === 'day' ? 'Turn the hour to night' : 'Turn the hour to day';
}

export function Daystar({ hour, className }: DaystarProps) {
  const [turns, setTurns] = useState(0);
  const faces = (
    <svg viewBox="0 0 240 240" aria-hidden="true" className="daystar__svg">
      <DaystarDefs />
      <DaystarFace variant="sun" />
      <DaystarFace variant="moon" />
      {turns > 0 && <Magic key={turns} />}
    </svg>
  );
  const style = { viewTransitionName: DAYSTAR_TRANSITION_NAME };
  if (!hour) {
    return (
      <div
        data-daystar="true"
        aria-hidden="true"
        style={style}
        className={cn('daystar', className)}
      >
        {faces}
      </div>
    );
  }
  return (
    <button
      type="button"
      data-daystar="true"
      data-hour={hour.current}
      aria-label={label(hour)}
      style={style}
      className={cn('daystar', className)}
      onClick={() => {
        setTurns((n) => n + 1);
        hour.turn();
      }}
    >
      {faces}
    </button>
  );
}
