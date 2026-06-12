import { useEffect } from 'react';

/**
 * Keyboard return wiring for `/sky`.
 *
 * The visitor entered by looking up; they leave by looking down.
 * `ArrowDown` for the visitor who's read the affordance ("↓ Return");
 * `Escape` for the modal-shaped instinct that any immersive surface
 * should accept. Both call the same callback, with `preventDefault()`
 * so the keys don't also scroll.
 *
 * The scroll and swipe returns that used to live here moved to the
 * threshold gesture (`useThresholdReveal`) — a leave that previews
 * and springs rather than firing at an invisible line. This hook is
 * the instant keyboard path that remains.
 *
 * @param onReturn callback invoked when a return key fires
 * @param enabled when false, the listener detaches (gated off while
 *   the work overlay is open — Escape belongs to the overlay then)
 */
export function useReturnGesture(onReturn: () => void, enabled = true) {
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

    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [enabled, onReturn]);
}
