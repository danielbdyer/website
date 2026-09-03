// The walk's discrete state, as a pure reducer.
//
// Where the visitor stands, what they have stood at and walked along
// this session, which facet they attend, and — while a hand holds the
// sky — which star it aims at. Each change is an event folded into the
// state; the hook (useSkyWalk) is a useReducer around this and one
// effect that remembers `here` for the session.
// CONSTELLATION_ARCHITECTURE.md §"Walk".

import type { Facet } from '@/shared/types/common';
import { POLE_KEY, type Place } from '@/shared/content/skyWalk';

export interface WalkState {
  readonly here: Place;
  readonly visited: ReadonlySet<string>;
  readonly walked: ReadonlySet<string>;
  readonly litFacet: Facet | null;
  readonly intent: string | null;
}

export type WalkEvent =
  | { readonly kind: 'arrived'; readonly place: Place; readonly alongEdgeId?: string | undefined }
  | { readonly kind: 'attended'; readonly facet: Facet | null }
  | { readonly kind: 'aimed'; readonly place: string | null };

const withKey = (set: ReadonlySet<string>, key: string): ReadonlySet<string> =>
  set.has(key) ? set : new Set([...set, key]);

export function initialWalk(here: Place): WalkState {
  return {
    here,
    visited: new Set(here === POLE_KEY ? [] : [here]),
    walked: new Set(),
    litFacet: null,
    intent: null,
  };
}

export function walkReducer(state: WalkState, event: WalkEvent): WalkState {
  switch (event.kind) {
    case 'arrived': {
      return {
        ...state,
        here: event.place,
        intent: null,
        visited: event.place === POLE_KEY ? state.visited : withKey(state.visited, event.place),
        walked: event.alongEdgeId ? withKey(state.walked, event.alongEdgeId) : state.walked,
      };
    }
    case 'attended': {
      return state.litFacet === event.facet ? state : { ...state, litFacet: event.facet };
    }
    case 'aimed': {
      return state.intent === event.place ? state : { ...state, intent: event.place };
    }
  }
}
