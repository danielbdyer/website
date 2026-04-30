import { useEffect, useRef } from 'react';

/**
 * Cursor-driven parallax for the constellation surface.
 *
 * Returns a ref to attach to the SVG (or any container) where the
 * cursor's position should drive the parallax. The hook updates two
 * CSS custom properties on the element: `--parallax-x` and
 * `--parallax-y`, each in the range [-1, 1] mapping linearly from the
 * element's left/top to right/bottom edge.
 *
 * Layered groups inside the element apply translate transforms based
 * on these variables — the firmament moves a little, the constellation
 * a bit more — so the body of the sky responds to the visitor's gaze
 * without performing the response. CSS transitions on the consumers
 * give the motion an arrival rhythm rather than a jitter.
 *
 * Honors `prefers-reduced-motion: reduce` by skipping listener setup
 * entirely. The variables remain at their unset state and the consumers
 * fall back to translate(0, 0). This is the body conserving itself
 * (per INTERACTION_DESIGN.md §"Reduced Motion").
 *
 * The hook attaches `pointermove` and `pointerleave` listeners; the
 * leave handler resets the variables so the parallax returns to
 * neutral when the cursor leaves the surface.
 */
// Pure helper: cursor coordinates → normalized [-1, 1] offset within
// the element's bounding rect. Extracted so the geometry is testable
// in isolation and the hook stays a thin wiring layer.
export function normalizedCursorOffset(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    x: ((clientX - rect.left) / rect.width - 0.5) * 2,
    y: ((clientY - rect.top) / rect.height - 0.5) * 2,
  };
}

type StyledElement = Element & ElementCSSInlineStyle;

export function useConstellationParallax<T extends StyledElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const setVars = (x: number, y: number) => {
      el.style.setProperty('--parallax-x', x.toFixed(3));
      el.style.setProperty('--parallax-y', y.toFixed(3));
    };

    const onMove = (e: PointerEvent) => {
      const offset = normalizedCursorOffset(el.getBoundingClientRect(), e.clientX, e.clientY);
      if (offset) setVars(offset.x, offset.y);
    };

    const onLeave = () => setVars(0, 0);

    el.addEventListener('pointermove', onMove as EventListener);
    el.addEventListener('pointerleave', onLeave as EventListener);
    return () => {
      el.removeEventListener('pointermove', onMove as EventListener);
      el.removeEventListener('pointerleave', onLeave as EventListener);
    };
  }, []);

  return ref;
}
