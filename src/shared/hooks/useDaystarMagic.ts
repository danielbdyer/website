import { useEffect, useRef, type RefObject } from 'react';
import type { MagicHandle } from '@/shared/dom/daystarMagic';
import { magicWanted, type MagicConditions } from '@/shared/sky/magicGate';

// The daystar's magic is a lazy layer: its driver and its animation
// library (GSAP) are fetched after the page has loaded and the browser
// is idle, never blocking the sky's first paint, and only when the
// visitor's preferences allow (sky/magicGate.ts). The hook owns what
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

export function useDaystarMagic(
  svgRef: RefObject<SVGSVGElement | null>,
): RefObject<MagicHandle | null> {
  const handleRef = useRef<MagicHandle | null>(null);
  useEffect(() => {
    // Under vitest the driver is tested directly; a ticker under every
    // component test would only churn.
    if (import.meta.env.MODE === 'test') return;
    if (!magicWanted(readConditions())) return;
    let cancelled = false;
    const cancelIdle = whenIdle(() => {
      void import('@/shared/dom/daystarMagic').then(({ mountDaystarMagic }) => {
        if (cancelled || !svgRef.current) return;
        handleRef.current = mountDaystarMagic(svgRef.current);
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [svgRef]);
  return handleRef;
}
