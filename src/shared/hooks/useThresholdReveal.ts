import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

// The overscroll threshold — CONSTELLATION.md §"The Reveal
// Mechanism"'s held gesture, in its first lived form. The visitor
// scrolls against the page's edge and a preview of the adjacent
// room leans in, spring-held: release early and it breathes back to
// nothing; push past the threshold and the gesture commits, the
// navigation goes the full direction. *The page resists for a held
// breath, like tipping a scale.*
//
// The hook owns the gesture math and a tiny critically-damped
// spring; the consumer owns the preview element (the returned ref)
// and what committing means. Progress is written to the element as
// `--reveal` ∈ [0, 1] once per frame — CSS shapes the preview from
// that single channel, so the hook stays markup-agnostic.
//
// Wheel is the primary instrument. Touch joins only where the
// surface scrolls natively (the Foyer's pull-down-at-top); on /sky
// the sphere drag owns touch, and the visible return link stays the
// honest path. Reduced motion disables the gesture entirely — the
// named links and keys remain.

const WHEEL_THRESHOLD_PX = 180;
const TOUCH_THRESHOLD_PX = 140;
// How long after the last input before the accumulated intent
// starts draining back toward rest.
const HOLD_MS = 90;
const DRAIN_RATE = 3.2;
const FOLLOW_RATE = 16;

// A cubic-bezier easing evaluator — returns f(x) → y for x ∈ [0, 1],
// solving x(t) by a few Newton steps then reading y(t). Standard CSS
// timing-function math; kept here so the resistance has a real curve
// rather than the bare linear progress the follower produced.
function cubicBezierEase(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  // Canonical coefficient form: p(t) = ((a·t + b)·t + c)·t for each axis.
  const cxc = 3 * x1;
  const bxc = 3 * (x2 - x1) - cxc;
  const axc = 1 - cxc - bxc;
  const cyc = 3 * y1;
  const byc = 3 * (y2 - y1) - cyc;
  const ayc = 1 - cyc - byc;
  const sampleX = (t: number): number => ((axc * t + bxc) * t + cxc) * t;
  const sampleY = (t: number): number => ((ayc * t + byc) * t + cyc) * t;
  const slopeX = (t: number): number => (3 * axc * t + 2 * bxc) * t + cxc;
  return (x: number): number => {
    const clamped = Math.min(Math.max(x, 0), 1);
    let t = clamped;
    for (let i = 0; i < 5; i++) {
      const dx = sampleX(t) - clamped;
      if (Math.abs(dx) < 1e-4) break;
      const d = slopeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= dx / d;
    }
    return sampleY(Math.min(Math.max(t, 0), 1));
  };
}

// The resistance curve. The follower produced a near-linear lean-in,
// which read as mechanical. This ease-in-out holds at the start (the
// page resists — "tipping a scale"), gives through the middle, and
// settles into the commit, so the preview leans in with a body rather
// than a slope. (Danny: there should be a cubic-bezier to the
// resistance.)
const RESISTANCE_EASE = cubicBezierEase(0.5, 0, 0.5, 1);

interface ThresholdRevealOptions {
  /** 'up' commits on scroll-up / pull-down (the Foyer looking up);
   *  'down' commits on scroll-down (the sky returning to ground). */
  readonly direction: 'up' | 'down';
  readonly onCommit: () => void;
  /** Gate — when false, listeners detach and the preview rests. */
  readonly enabled?: boolean;
  /** The gesture only gathers while this holds (e.g. the Foyer's
   *  scroll position is at the top). Checked per input. */
  readonly atBoundary?: () => boolean;
  /** Attach touch handling (pull gestures). Off where another
   *  surface owns touch. */
  readonly withTouch?: boolean;
}

interface RevealState {
  accum: number;
  shown: number;
  committed: boolean;
  lastInputAt: number;
  lastFrameAt: number;
  raf: number | null;
  touchY: number | null;
  touchBase: number;
}

function writeReveal(el: HTMLElement | null, value: number): void {
  el?.style.setProperty('--reveal', value.toFixed(4));
}

function stepReveal(el: HTMLElement | null, state: RevealState, onCommit: () => void): void {
  const now = performance.now();
  const dt = Math.min((now - state.lastFrameAt) / 1000, 0.1);
  state.lastFrameAt = now;
  if (!state.committed && now - state.lastInputAt > HOLD_MS) {
    state.accum *= Math.exp(-DRAIN_RATE * dt);
  }
  state.shown += (state.accum - state.shown) * (1 - Math.exp(-FOLLOW_RATE * dt));
  writeReveal(el, RESISTANCE_EASE(Math.min(state.shown, 1)));
  if (!state.committed && state.accum >= 1) {
    state.committed = true;
    writeReveal(el, 1);
    onCommit();
    state.raf = null;
    return;
  }
  if (state.accum < 0.003 && state.shown < 0.003) {
    state.accum = 0;
    state.shown = 0;
    writeReveal(el, 0);
    state.raf = null;
    return;
  }
  state.raf = requestAnimationFrame(() => stepReveal(el, state, onCommit));
}

function gather(el: HTMLElement | null, state: RevealState, amount: number, commit: () => void) {
  if (state.committed) return;
  state.accum = Math.min(Math.max(state.accum + amount, 0), 1.001);
  state.lastInputAt = performance.now();
  if (state.raf === null) {
    state.lastFrameAt = performance.now();
    state.raf = requestAnimationFrame(() => stepReveal(el, state, commit));
  }
}

export function useThresholdReveal<T extends HTMLElement>(
  options: ThresholdRevealOptions,
): RefObject<T | null> {
  const previewRef = useRef<T | null>(null);
  const { direction, enabled = true, withTouch = false } = options;
  // Latest-ref for the callbacks so a parent re-render (the sky
  // re-renders on every hover) never tears the listeners down
  // mid-pull and resets a gathering gesture.
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  });

  useEffect(() => {
    if (!enabled) return;
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const el = previewRef.current;
    const sign = direction === 'down' ? 1 : -1;
    const state: RevealState = {
      accum: 0,
      shown: 0,
      committed: false,
      lastInputAt: 0,
      lastFrameAt: 0,
      raf: null,
      touchY: null,
      touchBase: 0,
    };
    const commit = () => callbacksRef.current.onCommit();
    const outsideBoundary = () => {
      const atBoundary = callbacksRef.current.atBoundary;
      return atBoundary ? !atBoundary() : false;
    };
    const onWheel = (e: WheelEvent) => {
      const along = e.deltaY * sign;
      if (along <= 0 || outsideBoundary()) {
        state.accum = 0;
        state.lastInputAt = 0;
        return;
      }
      gather(el, state, along / WHEEL_THRESHOLD_PX, commit);
    };
    // Touch: a pull is a drag against the boundary — finger moving
    // down reveals what is above ('up'), finger moving up reveals
    // what is below ('down').
    const onTouchStart = (e: TouchEvent) => {
      if (outsideBoundary()) return;
      state.touchY = e.touches[0]?.clientY ?? null;
      state.touchBase = state.accum;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (state.touchY === null) return;
      const y = e.touches[0]?.clientY ?? state.touchY;
      const pulled = (y - state.touchY) * -sign;
      if (pulled <= 0) return;
      gather(el, state, state.touchBase + pulled / TOUCH_THRESHOLD_PX - state.accum, commit);
    };
    const onTouchEnd = () => {
      state.touchY = null;
    };
    globalThis.addEventListener('wheel', onWheel, { passive: true });
    if (withTouch) {
      globalThis.addEventListener('touchstart', onTouchStart, { passive: true });
      globalThis.addEventListener('touchmove', onTouchMove, { passive: true });
      globalThis.addEventListener('touchend', onTouchEnd, { passive: true });
    }
    return () => {
      if (state.raf !== null) cancelAnimationFrame(state.raf);
      writeReveal(el, 0);
      globalThis.removeEventListener('wheel', onWheel);
      if (withTouch) {
        globalThis.removeEventListener('touchstart', onTouchStart);
        globalThis.removeEventListener('touchmove', onTouchMove);
        globalThis.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, [direction, enabled, withTouch]);

  return previewRef;
}
