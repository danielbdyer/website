import { useState } from 'react';
import type { Facet } from '@/shared/types/common';
import { POLE_KEY, type Place } from '@/shared/content/skyWalk';
import { persistHere } from '@/shared/state/hereStorage';

/** The walk's state: where the visitor stands, what they have stood
 *  at and walked along this session, what they are attending to, and
 *  — while a hand holds the sky — which star it is aiming at.
 *  CONSTELLATION_WALK.md §"The Walk's Memory". Pure React state; the
 *  travel hook drives the camera, restores the session's remembered
 *  place, reports arrivals here, and aims. */
export interface SkyWalk {
  readonly here: Place;
  readonly visited: ReadonlySet<string>;
  readonly walked: ReadonlySet<string>;
  /** A facet whose figure is lit by attention — a hovered bearing or
   *  thread. Null when nothing is attended. */
  readonly litFacet: Facet | null;
  /** The star the held sky is likely to settle on when the hand lets
   *  go — the one nearest the center of view. Null when none is near. */
  readonly intent: string | null;
  readonly arrive: (place: Place, alongEdgeId?: string) => void;
  readonly attendFacet: (facet: Facet | null) => void;
  readonly aim: (place: string | null) => void;
}

const withKey = (set: ReadonlySet<string>, key: string): ReadonlySet<string> =>
  set.has(key) ? set : new Set([...set, key]);

export function useSkyWalk(initialHere: Place): SkyWalk {
  const [here, setHere] = useState<Place>(initialHere);
  const [visited, setVisited] = useState<ReadonlySet<string>>(
    () => new Set(initialHere === POLE_KEY ? [] : [initialHere]),
  );
  const [walked, setWalked] = useState<ReadonlySet<string>>(() => new Set());
  const [litFacet, setLitFacet] = useState<Facet | null>(null);
  const [intent, setIntent] = useState<string | null>(null);

  const arrive = (place: Place, alongEdgeId?: string) => {
    setHere(place);
    setIntent(null);
    persistHere(place);
    if (place !== POLE_KEY) setVisited((v) => withKey(v, place));
    if (alongEdgeId) setWalked((w) => withKey(w, alongEdgeId));
  };

  return {
    here,
    visited,
    walked,
    litFacet,
    intent,
    arrive,
    attendFacet: setLitFacet,
    aim: setIntent,
  };
}
