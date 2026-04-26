import { useCallback, useEffect, useRef, useState } from 'react';

// Plays a thumbnail's treatment animation under three triggers:
// - **first reveal**: when the card enters the viewport, once. The
//   IntersectionObserver fires immediately for above-the-fold cards, so
//   every card on the page demonstrates its animation on initial load.
// - **desktop hover**: any hover within the card replays.
// - **mobile tap**: any touch within the card replays. Tapping the text
//   region also navigates (the link still fires); tapping outside the
//   text region only replays.
//
// Returns:
// - `playKey`: an integer that increments each time the animation should
//   play. Treatments key their animated subtree on this so React mounts
//   a fresh element and the CSS animation runs from frame zero.
// - `cardRef`: ref to attach to the outer article — hosts the
//   IntersectionObserver and the hover/touch listeners.
//
// Honors `prefers-reduced-motion: reduce` by skipping the IntersectionObserver
// path entirely. Replay handlers still fire (a hover or tap should not be
// silently ignored), but treatments themselves render their reduced-motion
// variants when the preference is set.
export function useCardPlayback() {
  const cardRef = useRef<HTMLElement | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const hasRevealedRef = useRef(false);

  const trigger = useCallback(() => {
    setPlayKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || hasRevealedRef.current) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      hasRevealedRef.current = true;
      return;
    }

    const reveal = () => {
      if (hasRevealedRef.current) return;
      hasRevealedRef.current = true;
      trigger();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger]);

  return { playKey, cardRef, replay: trigger };
}
