import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { fitSurface, paintFrame, type Surface } from '@/shared/dom/scalePainter';
import {
  FOLD_MS,
  RIBBONS_MS,
  arrive,
  countOf,
  elapsedOf,
  isPaused,
  pause,
  resume,
  type Director,
} from '@/shared/scale/director';
import { frameOf } from '@/shared/scale/frame';
import type { SpeedRecord } from '@/shared/scale/records';
import { useReducedMotion } from './useReducedMotion';

// The shell around the bestiary's pure core (scale/director.ts,
// scale/frame.ts). This hook owns exactly what cannot be pure: the
// clock, the animation-frame schedule, the scroll position, the
// canvas, and the tab's visibility. Every decision is a call into the
// core: a director in, a director out; a frame out, painted. What
// crosses back into React is the page on stage and the counter, once
// per beat. OBJECTS_OF_SCALE.md §"How to build it".

/** Arrival is counted once the snap has all but landed. */
const SNAP_EPSILON = 0.02;
/** With no `scrollend`, a quiet spell this long is the end of a scroll. */
const SCROLL_QUIET_MS = 120;
/** The resolved character's moment on the clock — where a still page
 *  shows it. */
const CHARACTER_AT_MS = RIBBONS_MS + FOLD_MS;

interface Shell {
  director: Director;
  /** Fractional page position: index plus how far toward the next. */
  position: number;
  /** Reduced motion holds the picture still until the visitor plays. */
  still: boolean;
  pausedByTab: boolean;
  surface: Surface | null;
  raf: number | null;
  quiet: ReturnType<typeof setTimeout> | null;
  count: number;
}

/** What the shell reports back to React. */
interface Report {
  readonly onStage: (index: number) => void;
  readonly beat: (count: number) => void;
}

interface Mount {
  readonly shell: Shell;
  readonly scroller: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  readonly records: readonly SpeedRecord[];
  readonly report: Report;
}

export interface Bestiary {
  readonly scrollRef: RefObject<HTMLDivElement | null>;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  /** The record on stage, by index in the ladder as drawn. */
  readonly on: number;
  readonly count: number;
  /** The motion is running: not paused, not held still. */
  readonly running: boolean;
  readonly toggle: () => void;
}

const now = (): number => globalThis.performance.now();

/** Where the treadmill and the straws are this frame, and paint it. A
 *  page held still shows its resolved character with nothing moving. */
function paint(shell: Shell, records: readonly SpeedRecord[]): void {
  const record = records[shell.director.on];
  if (!record || !shell.surface) return;
  const toward = shell.position > shell.director.on ? 1 : -1;
  const next = records[shell.director.on + toward] ?? null;
  const fraction = Math.min(1, Math.abs(shell.position - shell.director.on));
  const elapsed = shell.still ? CHARACTER_AT_MS : elapsedOf(shell.director, now());
  const frame = frameOf(record, next, elapsed, { index: shell.director.on, fraction });
  paintFrame(shell.surface, record, shell.still ? { ...frame, treadmill: 0 } : frame);
}

/** One tick: paint, count, and — while the page is going — schedule
 *  the next. A paused page paints once and waits. */
function tick(shell: Shell, records: readonly SpeedRecord[], report: Report): void {
  shell.raf = null;
  paint(shell, records);
  const record = records[shell.director.on];
  const count = record ? countOf(record, elapsedOf(shell.director, now())) : 0;
  if (count !== shell.count) {
    shell.count = count;
    report.beat(count);
  }
  if (!isPaused(shell.director)) {
    shell.raf = globalThis.requestAnimationFrame(() => tick(shell, records, report));
  }
}

function wake(shell: Shell, records: readonly SpeedRecord[], report: Report): void {
  if (shell.raf === null) tick(shell, records, report);
}

/** Land on a page: the clock resets, the counter with it, and the
 *  address names the page. */
function land({ shell, records, report }: Mount, index: number): void {
  shell.director = arrive(index, now());
  shell.position = index;
  shell.count = 0;
  report.onStage(index);
  report.beat(0);
  const record = records[index];
  if (record) globalThis.history.replaceState(null, '', `#${record.id}`);
  wake(shell, records, report);
}

/** The scroll read as a page position. Arrival — the clock reset — is
 *  reserved for landing on a different page; snapping back to the
 *  same page resumes it. */
function readScroll(mount: Mount): void {
  const { shell, scroller } = mount;
  shell.position = scroller.scrollTop / (scroller.clientHeight || 1);
  const nearest = Math.round(shell.position);
  if (nearest !== shell.director.on && Math.abs(shell.position - nearest) < SNAP_EPSILON) {
    land(mount, nearest);
  }
}

/** The tab hidden pauses the clock; shown again, it resumes — unless
 *  the visitor had paused it themselves. */
function watchVisibility(mount: Mount): void {
  const { shell, records, report } = mount;
  if (document.hidden) {
    if (isPaused(shell.director)) return;
    shell.pausedByTab = true;
    shell.director = pause(shell.director, now());
    return;
  }
  if (!shell.pausedByTab) return;
  shell.pausedByTab = false;
  shell.director = resume(shell.director, now());
  wake(shell, records, report);
}

/** Mount: fit the canvas, open on the page the address names (a deep
 *  link scrolls there instantly so the page's own entrance is what
 *  plays), and listen to the scroll, the frame, and the tab. */
function mountBestiary(mount: Mount): () => void {
  const { shell, scroller, canvas, records, report } = mount;
  const settle = () => {
    if (shell.quiet !== null) clearTimeout(shell.quiet);
    shell.quiet = null;
    readScroll(mount);
  };
  const onScroll = () => {
    readScroll(mount);
    wake(shell, records, report);
    if (shell.quiet !== null) clearTimeout(shell.quiet);
    shell.quiet = setTimeout(settle, SCROLL_QUIET_MS);
  };
  const onVisibility = () => watchVisibility(mount);
  const resize = new ResizeObserver(() => {
    shell.surface = fitSurface(canvas);
    paint(shell, records);
  });
  shell.surface = fitSurface(canvas);
  const hashed = records.findIndex((r) => `#${r.id}` === globalThis.location.hash);
  if (hashed > 0) scroller.scrollTo({ top: hashed * scroller.clientHeight, behavior: 'instant' });
  land(mount, Math.max(0, hashed));
  resize.observe(canvas);
  scroller.addEventListener('scroll', onScroll, { passive: true });
  scroller.addEventListener('scrollend', settle);
  document.addEventListener('visibilitychange', onVisibility);
  readScroll(mount);
  return () => {
    resize.disconnect();
    scroller.removeEventListener('scroll', onScroll);
    scroller.removeEventListener('scrollend', settle);
    document.removeEventListener('visibilitychange', onVisibility);
    if (shell.raf !== null) globalThis.cancelAnimationFrame(shell.raf);
    shell.raf = null;
    if (shell.quiet !== null) clearTimeout(shell.quiet);
  };
}

/** The one control: a still page plays, a paused page resumes, a
 *  running page pauses. */
function toggleMotion(shell: Shell): void {
  if (shell.still) {
    shell.still = false;
    shell.director = resume(shell.director, now());
  } else if (isPaused(shell.director)) {
    shell.director = resume(shell.director, now());
  } else {
    shell.director = pause(shell.director, now());
  }
  shell.pausedByTab = false;
}

export function useBestiary(records: readonly SpeedRecord[]): Bestiary {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shell = useRef<Shell>({
    director: arrive(0, 0),
    position: 0,
    still: false,
    pausedByTab: false,
    surface: null,
    raf: null,
    quiet: null,
    count: 0,
  });
  const reduced = useReducedMotion();
  const [on, setOn] = useState(0);
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    const canvas = canvasRef.current;
    if (!scroller || !canvas) return;
    shell.current.still = reduced;
    const report: Report = { onStage: setOn, beat: setCount };
    return mountBestiary({ shell: shell.current, scroller, canvas, records, report });
  }, [records, reduced]);

  const toggle = () => {
    const s = shell.current;
    if (s.still) setPlayed(true);
    toggleMotion(s);
    setPaused(isPaused(s.director));
    wake(s, records, { onStage: setOn, beat: setCount });
  };

  return { scrollRef, canvasRef, on, count, running: !paused && !(reduced && !played), toggle };
}
