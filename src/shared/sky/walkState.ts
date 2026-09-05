// The walk's discrete state, as a pure reducer.
//
// Where the visitor stands, where they are bound, what they have stood
// at and walked along this session, which facet they attend, what the
// pointer rests on, and — while a hand holds the sky — which star it
// aims at. Each change is an event folded into the state; the hook
// (useSkyWalk) is a useReducer around this and one effect that
// remembers `here` for the session.
//
// The reducer owns attention. A place has one attention at a time: while
// the sky is in motion — heading somewhere, or held by a hand — a hover
// is refused, so a star streaming past the pointer never claims and a
// star pressed at the start of a drag is let go of when the hand
// engages. CONSTELLATION_ARCHITECTURE.md §"Walk";
// CONSTELLATION_STORYBOARD.md §"The Hybrid".

import type { Facet } from '@/shared/types/common';
import { POLE_KEY, type Place } from '@/shared/content/skyWalk';

export interface WalkState {
  readonly here: Place;
  /** The place a travel is bound for, and the thread it follows; null
   *  at rest. The destination is framed ahead while this is set. */
  readonly heading: Place | null;
  readonly headingEdgeId: string | null;
  /** Whether a hand holds the sky (engaged past the drag threshold). */
  readonly held: boolean;
  readonly visited: ReadonlySet<string>;
  readonly walked: ReadonlySet<string>;
  readonly litFacet: Facet | null;
  /** The star a held sky is aiming at; kept through the settle. */
  readonly intent: string | null;
  /** The star under the pointer or keyboard focus. */
  readonly hovered: string | null;
  /** The thread under the pointer. */
  readonly tracedThread: string | null;
}

export type WalkEvent =
  | { readonly kind: 'departed'; readonly place: Place; readonly alongEdgeId?: string | undefined }
  | { readonly kind: 'arrived'; readonly place: Place; readonly alongEdgeId?: string | undefined }
  | { readonly kind: 'held' }
  | { readonly kind: 'released' }
  | { readonly kind: 'attended'; readonly facet: Facet | null }
  | { readonly kind: 'aimed'; readonly place: string | null }
  | { readonly kind: 'hovered'; readonly place: string | null }
  | { readonly kind: 'traced'; readonly thread: string | null };

const withKey = (set: ReadonlySet<string>, key: string): ReadonlySet<string> =>
  set.has(key) ? set : new Set([...set, key]);

export function initialWalk(here: Place): WalkState {
  return {
    here,
    heading: null,
    headingEdgeId: null,
    held: false,
    visited: new Set(here === POLE_KEY ? [] : [here]),
    walked: new Set(),
    litFacet: null,
    intent: null,
    hovered: null,
    tracedThread: null,
  };
}

/** Whether the sky is under way — bound somewhere, or in a hand. */
export function isMoving(state: WalkState): boolean {
  return state.heading !== null || state.held;
}

export function walkReducer(state: WalkState, event: WalkEvent): WalkState {
  switch (event.kind) {
    case 'departed': {
      return {
        ...state,
        heading: event.place,
        headingEdgeId: event.alongEdgeId ?? null,
        hovered: null,
        tracedThread: null,
      };
    }
    case 'arrived': {
      return {
        ...state,
        here: event.place,
        heading: null,
        headingEdgeId: null,
        held: false,
        intent: null,
        visited: event.place === POLE_KEY ? state.visited : withKey(state.visited, event.place),
        walked: event.alongEdgeId ? withKey(state.walked, event.alongEdgeId) : state.walked,
      };
    }
    case 'held': {
      return { ...state, held: true, hovered: null, tracedThread: null };
    }
    case 'released': {
      return state.held ? { ...state, held: false } : state;
    }
    case 'attended': {
      return state.litFacet === event.facet ? state : { ...state, litFacet: event.facet };
    }
    case 'aimed': {
      return state.intent === event.place ? state : { ...state, intent: event.place };
    }
    case 'hovered': {
      if (isMoving(state) || state.hovered === event.place) return state;
      return { ...state, hovered: event.place };
    }
    case 'traced': {
      if (isMoving(state) || state.tracedThread === event.thread) return state;
      return { ...state, tracedThread: event.thread };
    }
  }
}
