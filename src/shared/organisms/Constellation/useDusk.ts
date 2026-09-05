import { useEffect, useRef, useState } from 'react';

// The sky's hour changes over a 1.8s dusk (the atmosphere's
// THEME_FADE_SECONDS; the frame's sunset and the daystar's flare keep
// the same arc). This hook holds the dusk as a fact the frame can
// carry: true from the moment the hour turns until the arc is done,
// false at rest and on the first render, whatever hour that is — a
// mount is not a turn.

export const DUSK_MS = 1800;

export function useDusk(hour: 'day' | 'night' | undefined): boolean {
  const [dusk, setDusk] = useState(false);
  const last = useRef(hour);
  useEffect(() => {
    if (last.current === hour) return;
    last.current = hour;
    setDusk(true);
    const timer = setTimeout(() => setDusk(false), DUSK_MS);
    return () => clearTimeout(timer);
  }, [hour]);
  return dusk;
}
