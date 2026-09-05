import { useEffect, useRef, type RefObject } from 'react';
import type { MagicHandle } from '@/shared/dom/daystarMagic';
import type * as Magic from '@/shared/dom/daystarMagic';
import { magicWanted, type MagicConditions } from '@/shared/sky/magicGate';

// The daystar's magic is a lazy layer: its driver, its animation
// library (GSAP), and the body's painter are fetched after the page
// has loaded and the browser is idle, never blocking the sky's first
// paint, and only when the visitor's preferences allow
// (sky/magicGate.ts). The hook owns what
// cannot be pure — the idle schedule, the dynamic import, the mount and
// its disposal — and hands the component a handle to lend the scarf
// energy and to whirl it. PERFORMANCE_BUDGET.md §"The sky's lazy
// layers".

function readConditions(): MagicConditions {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return {
    reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
    saveData: connection?.saveData === true,
    search: globalThis.location.search,
  };
}

/** Run `callback` once the page has loaded and the browser is idle.
 *  Returns a cancel. Where idle callbacks are missing, a short pause
 *  after load stands in. */
export function whenIdle(callback: () => void): () => void {
  const idle = (): (() => void) => {
    if ('requestIdleCallback' in globalThis) {
      const id = requestIdleCallback(() => callback(), { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(callback, 200);
    return () => clearTimeout(timer);
  };
  if (document.readyState === 'complete') return idle();
  let cancelInner: (() => void) | null = null;
  const onLoad = () => {
    cancelInner = idle();
  };
  globalThis.addEventListener('load', onLoad, { once: true });
  return () => {
    globalThis.removeEventListener('load', onLoad);
    cancelInner?.();
  };
}

type MagicModule = typeof Magic;

// A Map rather than a reassigned binding, so the memo needs no
// mutation the FP rules refuse.
const warmed = new Map<'magic', Promise<MagicModule>>();

function loadMagic(): Promise<MagicModule> {
  const loading = warmed.get('magic') ?? import('@/shared/dom/daystarMagic');
  warmed.set('magic', loading);
  return loading;
}

const magicWarmed = (): boolean => warmed.has('magic');

/** Run at once; nothing to cancel. */
function mountNow(mount: () => void): () => void {
  mount();
  return () => {
    // Already mounted; nothing scheduled to cancel.
  };
}

/** Fetch the magic ahead — the Foyer calls this as the visitor reaches
 *  for the sky — so the daystar arrives with its scarf and its painted
 *  body rather than growing them after idle. Same gates as the mount. */
export function warmDaystarMagic(): void {
  if (typeof document === 'undefined' || !magicWanted(readConditions())) return;
  void loadMagic();
}

export function useDaystarMagic(
  rootRef: RefObject<HTMLElement | null>,
): RefObject<MagicHandle | null> {
  const handleRef = useRef<MagicHandle | null>(null);
  useEffect(() => {
    // Under vitest the driver is tested directly; a ticker under every
    // component test would only churn.
    if (import.meta.env.MODE === 'test') return;
    if (!magicWanted(readConditions())) return;
    let cancelled = false;
    const mount = () => {
      void loadMagic().then(({ mountDaystarMagic }) => {
        if (cancelled || !rootRef.current) return;
        handleRef.current = mountDaystarMagic(rootRef.current);
      });
    };
    // Warmed ahead by the visitor's reach, the magic mounts at once;
    // otherwise it waits for load and idle.
    const cancelIdle = magicWarmed() ? mountNow(mount) : whenIdle(mount);
    return () => {
      cancelled = true;
      cancelIdle();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [rootRef]);
  return handleRef;
}
