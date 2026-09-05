// The daystar's magic: a scarf of silk that swoops around the hour's
// face, changing color as it goes, in three dimensions — behind the
// disc and out in front — and, beneath the ink, the body itself
// painted as living pigment (webgl/daystarPaint.ts). The scarf's
// geometry is pure (sky/scarfGeometry.ts); this module is the driver:
// it holds the moods — how much energy the pointer has lent, how hard
// the turn is whirling, how far the silk's colors have flowed, how
// far into the night the body has turned — tweens them with GSAP, and
// on GSAP's ticker writes the scarf's paths and paints the body. It
// is fetched lazily, after the page is idle, and only when the
// visitor's preferences allow (hooks/useDaystarMagic.ts,
// sky/magicGate.ts). CONSTELLATION.md §"The Sun and the Moon";
// CONSTELLATION_STORYBOARD.md §"Scene 12".

import { gsap } from 'gsap';
import {
  FACE_CENTER,
  SCARF_AT_REST,
  scarfPaths,
  strandShapes,
  type ScarfPaths,
  type ScarfShape,
} from '@/shared/sky/scarfGeometry';
import { mountDaystarPaint, readPaintTone, type PaintHandle } from '@/shared/webgl/daystarPaint';

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
  /** 0 by day, 1 by night; the turn crossfades the body's paint. */
  night: number;
  /** How much of the scarf is here at all: 1 while it drifts, 0 once
   *  it has slipped away after a turn — slowly, so no one sees it
   *  go — until the pointer's next visit brings it back. */
  presence: number;
}

/** One side of the scarf: its strands' bodies, and the main strand's sheen. */
interface Side {
  readonly bodies: readonly SVGElement[];
  readonly sheen: SVGElement;
}

interface ScarfElements {
  readonly behind: Side;
  readonly front: Side;
  /** Echoes of the main front strand — the sun's backlit silk, the
   *  moon's cast shadow — written the same path each frame. */
  readonly echoes: readonly SVGElement[];
  readonly silk: SVGElement;
  /** The body's canvas, between the scarf's two slots. */
  readonly canvas: HTMLCanvasElement | null;
}

function locateSide(root: HTMLElement, side: 'behind' | 'front'): Side | null {
  const slot = root.querySelector(`.daystar__scarf--${side}`);
  const sheen = slot?.querySelector<SVGElement>('.daystar__scarf-sheen');
  const bodies = [...(slot?.querySelectorAll<SVGElement>('.daystar__scarf-body') ?? [])];
  if (!sheen || bodies.length === 0) return null;
  return { bodies, sheen };
}

function locate(root: HTMLElement): ScarfElements | null {
  const behind = locateSide(root, 'behind');
  const front = locateSide(root, 'front');
  const silk = root.querySelector<SVGElement>('#daystar-silk');
  const echoes = [...root.querySelectorAll<SVGElement>('[data-scarf-echo="front-0"]')];
  const canvas = root.querySelector<HTMLCanvasElement>('canvas.daystar__paint');
  if (!behind || !front || !silk) return null;
  return { behind, front, echoes, silk, canvas };
}

const isNight = (): boolean => document.documentElement.classList.contains('dk');

/** The class the root wears while its body is painted, so the drawn
 *  discs can thin to a wash and let the paint through. */
export const PAINTED_CLASS = 'daystar--painted';

/** The body's paint, mounted on the canvas when WebGL is to be had. */
function mountPaint(root: HTMLElement, canvas: HTMLCanvasElement | null): PaintHandle | null {
  if (!canvas) return null;
  const paint = mountDaystarPaint(canvas, readPaintTone(root));
  if (paint) root.classList.add(PAINTED_CLASS);
  return paint;
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
    radius: SCARF_AT_REST.radius + mood.energy * 6 - mood.whirl * 24,
    length: SCARF_AT_REST.length + mood.energy * 0.6 + mood.whirl * 2.2,
    width: SCARF_AT_REST.width + mood.energy * 3 + mood.whirl * 2,
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

function paintScarf(root: HTMLElement, els: ScarfElements, shape: ScarfShape, mood: Mood): void {
  const strands = strandShapes(shape).map((strand) => scarfPaths(strand, FACE_CENTER, FACE_CENTER));
  paintSide(els.behind, strands, 'behind');
  paintSide(els.front, strands, 'front');
  els.echoes.forEach((echo) => echo.setAttribute('d', strands[0]!.front));
  const sweep = (mood.flow * 360 + mood.whirl * 120).toFixed(1);
  els.silk.setAttribute('gradientTransform', `rotate(${sweep} ${FACE_CENTER} ${FACE_CENTER})`);
  root.style.setProperty('--scarf-glow', Math.min(1, mood.energy * 0.7 + mood.whirl).toFixed(3));
  root.style.setProperty('--scarf-presence', mood.presence.toFixed(3));
}

/** After the whirl has let go, the scarf slips away over a long
 *  breath — too slowly to be seen leaving — and rests until the
 *  pointer's next visit. */
function letScarfGo(mood: Mood): void {
  gsap.to(mood, { presence: 0, duration: 5, delay: 1.6, ease: 'sine.inOut', overwrite: 'auto' });
}

function callScarfBack(mood: Mood): void {
  gsap.to(mood, { presence: 1, duration: 0.9, ease: 'sine.out', overwrite: 'auto' });
}

/** The body turns with the coin: edge-on with the setting face, round
 *  again with the rising one, its paint crossing into the other hour
 *  while it is edge-on — and thinning into the silk at the edge, the
 *  way the drawn faces dissolve into it. Overwrites itself if the
 *  hour turns again mid-turn. */
function turnBody(canvas: HTMLCanvasElement | null, mood: Mood, night: number): void {
  const line = gsap.timeline({ defaults: { overwrite: 'auto' } });
  line.to(mood, { night, duration: 0.3, ease: 'sine.inOut' }, 0.15);
  if (!canvas) return;
  const away = night > 0.5 ? -14 : 14;
  line
    .to(
      canvas,
      {
        scaleX: 0.02,
        scaleY: 1.1,
        y: 6,
        rotation: away,
        opacity: 0.5,
        duration: 0.3,
        ease: 'power3.out',
      },
      0,
    )
    .set(canvas, { rotation: -away }, 0.3)
    .to(
      canvas,
      { scaleX: 1, scaleY: 1, y: 0, rotation: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
      0.3,
    );
}

/** Mount the magic into a daystar. Null when it carries no scarf to
 *  drive. */
export function mountDaystarMagic(root: HTMLElement): MagicHandle | null {
  const els = locate(root);
  if (!els) return null;
  const mood: Mood = { energy: 0, whirl: 0, flow: 0, night: isNight() ? 1 : 0, presence: 1 };
  const body = mountPaint(root, els.canvas);
  // The silk's colors flow around the scarf on their own slow clock.
  const flowing = gsap.to(mood, { flow: 1, duration: 28, ease: 'none', repeat: -1 });
  let shape: ScarfShape = SCARF_AT_REST;
  const tick = (time: number, deltaMs: number) => {
    // A scarf that has slipped away is not drawn again until called;
    // the register hears that it is gone.
    if (mood.presence > 0.002) {
      shape = advance(shape, mood, time, Math.min(deltaMs, 100) / 1000);
      paintScarf(root, els, shape, mood);
    } else {
      root.style.setProperty('--scarf-presence', '0.000');
    }
    body?.paint({ time, night: mood.night, energy: mood.energy, whirl: mood.whirl });
  };
  gsap.ticker.add(tick);
  // The hour can turn without the daystar's own click (the room's
  // toggle, a key): follow the root's class, and set the tones of the paint to
  // the hour's tokens.
  const hourWatch = new MutationObserver(() => {
    const night = isNight() ? 1 : 0;
    body?.setTone(readPaintTone(root));
    if (!gsap.isTweening(mood) || Math.round(mood.night) !== night) {
      gsap.to(mood, { night, duration: 0.3, ease: 'sine.inOut', overwrite: 'auto' });
    }
  });
  hourWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  const sizeWatch =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => body?.resize());
  sizeWatch?.observe(root);
  return {
    hover(on) {
      gsap.to(mood, {
        energy: on ? 1 : 0,
        duration: on ? 0.9 : 1.8,
        ease: on ? 'power2.out' : 'sine.inOut',
        overwrite: 'auto',
      });
      if (on) callScarfBack(mood);
    },
    turn() {
      gsap
        .timeline()
        .to(mood, { whirl: 1, duration: 0.42, ease: 'power3.out' })
        .to(mood, { whirl: 0, duration: 1.2, ease: 'power2.inOut' });
      turnBody(els.canvas, mood, isNight() ? 0 : 1);
      callScarfBack(mood);
      letScarfGo(mood);
    },
    dispose() {
      gsap.ticker.remove(tick);
      flowing.kill();
      gsap.killTweensOf(mood);
      if (els.canvas) gsap.killTweensOf(els.canvas);
      hourWatch.disconnect();
      sizeWatch?.disconnect();
      body?.dispose();
      root.classList.remove(PAINTED_CLASS);
    },
  };
}
