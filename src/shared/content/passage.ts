import type { Place } from './skyWalk';

// A passage: a way out of the sky that is not a star. The whisper
// offers it, as a fourth line, at one star only, and only to a
// visitor who has stood there a while — the sky keeps it the way a
// house keeps a door behind a bookcase. Where it leads is not a work
// and not a room; it is a place of its own, off the chart.
// CONSTELLATION_WALK.md §"The Whisper"; OBJECTS_OF_SCALE.md §"The
// passage".

export interface Passage {
  /** The star the passage leaves from, as a node key. */
  readonly from: Place;
  /** The address it leads to. */
  readonly to: '/scale';
  readonly title: string;
  /** The whisper's word for where this goes, before the title. */
  readonly line: string;
}

/** The one passage. It leaves from *small weather* — a poem in which
 *  distance is "just geography" — for the bestiary, where lying still
 *  you travel a marathon every 1.4 seconds. */
export const PASSAGE: Passage = {
  from: 'garden/small-weather',
  to: '/scale',
  title: 'Objects of Scale',
  line: 'off the chart',
};

/** How long a visitor stands at the star before the whisper adds the
 *  line. A held tuning. */
export const PASSAGE_DWELL_MS = 7000;

/** The passage that leaves from `here`, or null: most stars keep none. */
export function passageFrom(here: Place): Passage | null {
  return PASSAGE.from === here ? PASSAGE : null;
}
