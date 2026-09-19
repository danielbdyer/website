import { useSyncExternalStore } from 'react';

// The visitor's motion preference, read as an external store: the
// media query is the source of truth, its change event the
// subscription. The server has no visitor and answers false; React
// reconciles the client's answer after hydration without a mismatch.

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  const media = globalThis.matchMedia?.(QUERY);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

const snapshot = (): boolean => globalThis.matchMedia?.(QUERY).matches === true;
const serverSnapshot = (): boolean => false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
