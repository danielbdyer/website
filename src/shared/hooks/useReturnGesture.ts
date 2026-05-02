import { useEffect, useRef } from 'react';

/**
 * Return-gesture wiring for `/sky`.
 *
 * The visitor entered by looking up; they leave by looking down. Three
 * gestures, all calling the same callback:
 *
 *  - **`ArrowDown` or `Escape`** — keyboard. ArrowDown for the visitor
 *    who's read the affordance ("↓ Return"); Escape for the modal-shaped
 *    instinct that any immersive surface should accept.
 *  - **Sustained scroll-down** — `wheel` events accumulate; once the
 *    cumulative deltaY exceeds the threshold (220px, ~one page-down's
 *    worth on most trackpads), the return fires. Scrolling up resets
 *    the accumulator so the gesture is unambiguously *down*.
 *  - **Touch swipe-down** — touchstart/touchend distance. A swipe
 *    >120px downward triggers the return.
 *
 * All listeners are passive where the browser will accept it. The
 * `keydown` handler does call `preventDefault()` on the qualifying keys
 * so they don't also scroll the page.
 *
 * The hook returns nothing; the consumer wires `onReturn` to a router
 * navigation. Reduced motion is honored upstream by whatever transition
 * the navigation triggers; this hook is gesture-only and doesn't itself
 * animate.
 *
 * @param onReturn callback invoked when any return gesture fires
 * @param enabled when false, all listeners are detached (used to gate
 *   the hook by route — only attach on `/sky`)
 */
export function useReturnGesture(onReturn: () => void, enabled = true) {
  // Stateful gesture accumulators — wheel deltas summed across
  // events, touch start-Y captured per gesture. useRef rather
  // than `let` in a useEffect closure so the FP discipline (no
  // compound `+=` on plain bindings) is honored without losing
  // the cross-event continuity the gesture detector needs.
  const wheelAccumulator = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'Escape') return;
      // Don't hijack key events from inside form fields or contenteditable
      // surfaces — those have their own meaning for the same keys.
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      e.preventDefault();
      onReturn();
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        // Scrolling up resets the accumulator — the gesture is
        // unambiguously down or it doesn't count.
        wheelAccumulator.current = 0;
        return;
      }
      wheelAccumulator.current = wheelAccumulator.current + e.deltaY;
      if (wheelAccumulator.current > 220) {
        wheelAccumulator.current = 0;
        onReturn();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0]?.clientY ?? 0;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0]?.clientY ?? touchStartY.current;
      if (touchEndY - touchStartY.current > 120) {
        onReturn();
      }
    };

    globalThis.addEventListener('keydown', onKey);
    globalThis.addEventListener('wheel', onWheel, { passive: true });
    globalThis.addEventListener('touchstart', onTouchStart, { passive: true });
    globalThis.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      globalThis.removeEventListener('keydown', onKey);
      globalThis.removeEventListener('wheel', onWheel);
      globalThis.removeEventListener('touchstart', onTouchStart);
      globalThis.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, onReturn]);
}
