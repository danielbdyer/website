import { Link } from '@tanstack/react-router';
import type { Facet, Room } from '@/shared/types/common';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';

interface WorkOutwardInvitationProps {
  room: Room;
  roomPath: '/' | `/${Exclude<Room, 'foyer'>}`;
  roomLabel: string;
  /** Facets the work carries — surfaced as inline-link "threads" above
   *  the return-to-room line. Empty array elides the threads line. */
  facets: readonly Facet[];
}

// The outward invitation at the bottom of every work — `GRAPH_AND_LINKING.md`
// commits to "no work ends at its own last line." A subtle Ornament marks
// the section break; below it sit up to two voice-italic lines:
//
//   1. Facet threads (when the work carries facets) — e.g.,
//      "Also threaded through *beauty*, *body*."
//      Each facet links to /facet/{facet}; the line invites a lateral
//      move along the thread the visitor is already on. Voice rule from
//      VOICE_AND_COPY.md §"The outward invitation": *"Never 'Related:'.
//      Never 'See also:'. The phrasing invites, it doesn't label."*
//
//   2. Return to room (always) — "Keep wandering in *Room* →"
//      The guaranteed final line; the visitor can always leave back
//      into the room they came from.
//
// Future passes here: backlinks ("Mentioned in [[work-a]]") via
// GRAPH_AND_LINKING wikilink resolution, and adjacent-work hints
// ("Read next: [[work-b]]") once the graph is rich enough. Both held
// in BACKLOG.md.
export function WorkOutwardInvitation({ roomPath, roomLabel, facets }: WorkOutwardInvitationProps) {
  return (
    <>
      <Ornament className="mt-work-break sm:mt-work-break-md" />
      <div className="mt-room-rhythm font-body text-list leading-closing italic text-text-2">
        {facets.length > 0 && <FacetThreadsLine facets={facets} />}
        <p>
          Keep wandering in{' '}
          <Link
            to={roomPath}
            className="border-b border-transparent text-text-2 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text"
          >
            {roomLabel}
          </Link>{' '}
          →
        </p>
      </div>
    </>
  );
}

function FacetThreadsLine({ facets }: { facets: readonly Facet[] }) {
  return (
    <p className="mb-2">
      Also threaded through{' '}
      {facets.map((facet, i) => (
        <span key={facet}>
          {i > 0 && (i === facets.length - 1 ? ' and ' : ', ')}
          <Link
            to="/facet/$facet"
            params={{ facet }}
            className="border-b border-transparent text-text-2 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text"
          >
            {facet}
          </Link>
        </span>
      ))}
      .
    </p>
  );
}
