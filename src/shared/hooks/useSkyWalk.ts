import { useEffect, useReducer } from 'react';
import type { Place } from '@/shared/content/skyWalk';
import { initialWalk, walkReducer, type WalkState } from '@/shared/sky/walkState';
import { persistHere } from '@/shared/state/hereStorage';

/** The walk's state and the three things that change it. The state is
 *  a pure reducer (sky/walkState.ts); this hook holds it in React and
 *  remembers `here` for the session. CONSTELLATION_WALK.md §"The
 *  Walk's Memory". */
export interface SkyWalk extends WalkState {
  readonly arrive: (place: Place, alongEdgeId?: string) => void;
  readonly attendAxis: (axis: string | null) => void;
  readonly aim: (place: string | null) => void;
}

export function useSkyWalk(initialHere: Place): SkyWalk {
  const [state, dispatch] = useReducer(walkReducer, initialHere, initialWalk);

  // Remembering where the visitor stands is a write to an external
  // store — the one legitimate kind of effect — and it follows `here`
  // rather than living inside the reducer, which stays pure.
  useEffect(() => {
    persistHere(state.here);
  }, [state.here]);

  return {
    ...state,
    arrive: (place, alongEdgeId) => dispatch({ kind: 'arrived', place, alongEdgeId }),
    attendAxis: (axis) => dispatch({ kind: 'attended', axis }),
    aim: (place) => dispatch({ kind: 'aimed', place }),
  };
}
