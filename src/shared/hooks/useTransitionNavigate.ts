import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';

type AnyNavigate = (args: never) => void | Promise<void>;

// Wraps an arbitrary `navigate` call (the one returned by `useNavigate`
// or by a typed `Route.useNavigate()`) in `document.startViewTransition`
// when the browser supports it and the visitor has not requested
// reduced motion. The fallback path navigates immediately. Either way,
// the route change happens — the difference is whether the browser
// captures before/after snapshots and morphs between them.
//
// **Animation comes from the DOM, not from this hook.** The hook only
// triggers the snapshot. Motion happens because participating elements
// (the FacetCard, the SalonCard thumbnail, the WorkView hero) carry
// stable `viewTransitionName` values that match across the source and
// destination DOMs. The browser identifies the same conceptual element
// in both snapshots and animates the difference.
export function withTransition<F extends AnyNavigate>(navigate: F): F {
  const wrapped = ((args: Parameters<F>[0]) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsViewTransition = typeof document.startViewTransition === 'function';
    if (!supportsViewTransition || reduceMotion) {
      return navigate(args);
    }
    document.startViewTransition(async () => {
      await Promise.resolve(navigate(args));
    });
  }) as F;
  return wrapped;
}

// Convenience hook for callers that don't already have a typed navigate
// in hand — uses the global `useNavigate` and applies the wrapper. Used
// by TransitionLink (where the destination's typed shape is provided by
// the wrapping `<Link>` props rather than by the navigate call site).
export function useTransitionNavigate() {
  const navigate = useNavigate();
  return useMemo(() => withTransition(navigate), [navigate]);
}
