import { useEffect, useReducer } from 'react';
import type { Facet } from '@/shared/types/common';
import type { Place } from '@/shared/content/skyWalk';
import { initialWalk, walkReducer, type WalkEvent, type WalkState } from '@/shared/sky/walkState';
import { persistHere } from '@/shared/state/hereStorage';

/** The walk's state and the one way it changes: an event sent to the
 *  reducer (sky/walkState.ts). The named senders are conveniences for
 *  the view; the shell hands the motion core's events on through
 *  `send`. This hook holds the state in React and remembers `here`
 *  for the session. CONSTELLATION_WALK.md §"The Walk's Memory". */
export interface SkyWalk extends WalkState {
  readonly send: (event: WalkEvent) => void;
  readonly arrive: (place: Place, alongEdgeId?: string) => void;
  readonly attendFacet: (facet: Facet | null) => void;
  readonly aim: (place: string | null) => void;
  readonly hover: (place: string | null) => void;
  readonly trace: (thread: string | null) => void;
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
    send: dispatch,
    arrive: (place, alongEdgeId) => dispatch({ kind: 'arrived', place, alongEdgeId }),
    attendFacet: (facet) => dispatch({ kind: 'attended', facet }),
    aim: (place) => dispatch({ kind: 'aimed', place }),
    hover: (place) => dispatch({ kind: 'hovered', place }),
    trace: (thread) => dispatch({ kind: 'traced', thread }),
  };
}
