import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { whenIdle } from '@/shared/hooks/useDaystarMagic';

// The look-up should find the sky already there. While the Foyer
// rests — after load, once the browser is idle — everything the sky
// mounts is made ahead: the route's code and its loader's graph; the
// atmosphere's module, context, and compiled programs, on a canvas
// not yet on the page, adopted whole when the sky mounts
// (webgl/warmAtmosphere.ts); and the daystar's magic. Nothing is
// created under the visitor's eye, so the lift into the heavens
// (tokens.css §"The ascent") plays over a sky that is simply there.
//
// This is the Foyer's own readiness, not a rule for every room: the
// look-up is the Foyer's primary gesture, and its ceiling is the sky.
// The gates hold — reduced motion, Save-Data, and ?atmosphere=off
// still refuse the atmosphere; ?magic=off the magic — and the cost is
// paid at idle, never on arrival. PERFORMANCE_BUDGET.md §"The Sky's
// Lazy Layers".

/** The readiness is best effort: a preload that fails leaves the
 *  look-up exactly as it was. */
function quietly(): void {
  // Nothing to do; the sky mounts as it always could.
}

export function useSkyReadiness(): void {
  const router = useRouter();
  useEffect(() => {
    return whenIdle(() => {
      void router.preloadRoute({ to: '/sky' }).catch(quietly);
      void import('@/shared/webgl/readySky').then(({ readySky }) => readySky()).catch(quietly);
    });
  }, [router]);
}
