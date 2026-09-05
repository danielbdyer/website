// The daystar's magic: a scarf of silk that swoops around the hour's
// face, changing color as it goes, in three dimensions — behind the
// disc and out in front. The geometry is pure (sky/scarfGeometry.ts);
// this module is the driver: it holds the scarf's moods — how much
// energy the pointer has lent it, how hard the turn is whirling it,
// how far the silk's colors have flowed — tweens them with GSAP, and
// writes the paths on GSAP's ticker. It is fetched lazily, after the
// page is idle, and only when the visitor's preferences allow
// (hooks/useDaystarMagic.ts, sky/magicGate.ts). CONSTELLATION.md
// §"The Sun and the Moon"; CONSTELLATION_STORYBOARD.md §"Scene 12".

import { gsap } from 'gsap';
import {
  FACE_CENTER,
  SCARF_AT_REST,
  scarfPaths,
  strandShapes,
  type ScarfPaths,
  type ScarfShape,
} from '@/shared/sky/scarfGeometry';

export interface MagicHandle {
  /** The pointer has come to rest on the face, or left it. */
  readonly hover: (on: boolean) => void;
  /** The hour is turning: the scarf whirls tight and lets go. */
  readonly turn: () => void;
  readonly dispose: () => void;
}

/** The scarf's moods. Mutable on purpose: GSAP tweens these in place,
 *  and the ticker reads them each frame. */
interface Mood {
  energy: number;
  whirl: number;
  flow: number;
}

/** One side of the scarf: its strands' bodies, and the main strand's sheen. */
interface Side {
  readonly bodies: readonly SVGElement[];
  readonly sheen: SVGElement;
}

interface ScarfElements {
  readonly behind: Side;
  readonly front: Side;
  readonly silk: SVGElement;
}

function locateSide(svg: SVGSVGElement, side: 'behind' | 'front'): Side | null {
  const root = svg.querySelector(`.daystar__scarf--${side}`);
  const sheen = root?.querySelector<SVGElement>('.daystar__scarf-sheen');
  const bodies = [...(root?.querySelectorAll<SVGElement>('.daystar__scarf-body') ?? [])];
  if (!sheen || bodies.length === 0) return null;
  return { bodies, sheen };
}

function locate(svg: SVGSVGElement): ScarfElements | null {
  const behind = locateSide(svg, 'behind');
  const front = locateSide(svg, 'front');
  const silk = svg.querySelector<SVGElement>('#daystar-silk');
  if (!behind || !front || !silk) return null;
  return { behind, front, silk };
}

/** The scarf's shape a moment on from the last, under the moods: the
 *  silk drifts at rest, quickens under the pointer, and whirls tight
 *  and close through the turn. */
function advance(shape: ScarfShape, mood: Mood, time: number, dt: number): ScarfShape {
  return {
    ...shape,
    phase: shape.phase + dt * (0.26 + mood.energy * 0.5 + mood.whirl * 2.4),
    spin: shape.spin + dt * (0.1 + mood.whirl * 1.1),
    wavePhase: shape.wavePhase + dt * (1.4 + mood.energy * 1.4 + mood.whirl * 2),
    tilt: 0.85 + 0.22 * Math.sin(time * 0.19),
    radius: SCARF_AT_REST.radius + mood.energy * 6 - mood.whirl * 18,
    length: SCARF_AT_REST.length + mood.energy * 0.6 + mood.whirl * 2.2,
    width: SCARF_AT_REST.width + mood.energy * 3 + mood.whirl,
    wave: SCARF_AT_REST.wave + mood.energy * 3 + mood.whirl * 5,
  };
}

function paintSide(side: Side, strands: readonly ScarfPaths[], depth: 'behind' | 'front'): void {
  side.bodies.forEach((body, k) => body.setAttribute('d', strands[k]?.[depth] ?? ''));
  side.sheen.setAttribute(
    'd',
    depth === 'behind' ? strands[0]!.sheenBehind : strands[0]!.sheenFront,
  );
}

function paint(svg: SVGSVGElement, els: ScarfElements, shape: ScarfShape, mood: Mood): void {
  const strands = strandShapes(shape).map((strand) => scarfPaths(strand, FACE_CENTER, FACE_CENTER));
  paintSide(els.behind, strands, 'behind');
  paintSide(els.front, strands, 'front');
  const sweep = (mood.flow * 360 + mood.whirl * 120).toFixed(1);
  els.silk.setAttribute('gradientTransform', `rotate(${sweep} ${FACE_CENTER} ${FACE_CENTER})`);
  svg.style.setProperty('--scarf-glow', Math.min(1, mood.energy * 0.7 + mood.whirl).toFixed(3));
}

/** Mount the magic into a daystar's svg. Null when the svg carries no
 *  scarf to drive. */
export function mountDaystarMagic(svg: SVGSVGElement): MagicHandle | null {
  const els = locate(svg);
  if (!els) return null;
  const mood: Mood = { energy: 0, whirl: 0, flow: 0 };
  // The silk's colors flow around the scarf on their own slow clock.
  const flowing = gsap.to(mood, { flow: 1, duration: 28, ease: 'none', repeat: -1 });
  let shape: ScarfShape = SCARF_AT_REST;
  const tick = (time: number, deltaMs: number) => {
    shape = advance(shape, mood, time, Math.min(deltaMs, 100) / 1000);
    paint(svg, els, shape, mood);
  };
  gsap.ticker.add(tick);
  return {
    hover(on) {
      gsap.to(mood, {
        energy: on ? 1 : 0,
        duration: on ? 0.9 : 1.8,
        ease: on ? 'power2.out' : 'sine.inOut',
        overwrite: 'auto',
      });
    },
    turn() {
      gsap
        .timeline()
        .to(mood, { whirl: 1, duration: 0.5, ease: 'power3.out' })
        .to(mood, { whirl: 0, duration: 1.5, ease: 'power2.inOut' });
    },
    dispose() {
      gsap.ticker.remove(tick);
      flowing.kill();
      gsap.killTweensOf(mood);
    },
  };
}
