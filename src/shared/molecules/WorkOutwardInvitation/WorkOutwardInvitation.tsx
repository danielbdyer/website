import { Link } from '@tanstack/react-router';
import type { Facet, Room } from '@/shared/types/common';
import type { BacklinkRef } from '@/shared/content/schema';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { formatSeries } from '@/shared/utils/format-series';

interface WorkOutwardInvitationProps {
  room: Room;
  roomPath: '/' | `/${Exclude<Room, 'foyer'>}`;
  roomLabel: string;
  /** Facets the work carries — surfaced as inline-link "threads" above
   *  the return-to-room line. Empty array elides the threads line. */
  facets: readonly Facet[];
  /** Other published works that link to this one via [[wikilinks]].
   *  Computed at build time. Empty array elides the line. */
  backlinks: readonly BacklinkRef[];
}

// The outward invitation at the bottom of every work — `GRAPH_AND_LINKING.md`
// commits to "no work ends at its own last line." A subtle Ornament marks
// the section break; below it sit up to three voice-italic lines, in
// the priority order the spec names:
//
//   1. Facet threads (when the work carries facets) — e.g.,
//      "Also threaded through *beauty*, *body*."
//
//   2. Backlinks (when other published works link to this one) — e.g.,
//      "Mentioned in *another work* and *another*."
//      Backlinks are computed at build time from `[[wikilinks]]` in
//      every published body; the inversion is sorted newest-first.
//
//   3. Return to room (always) — "Keep wandering in *Room* →"
//      The guaranteed final line; the visitor can always leave back
//      into the room they came from.
//
// Voice rules from VOICE_AND_COPY.md §"The outward invitation":
// *"Never 'Related:'. Never 'See also:'. The phrasing invites, it
// doesn't label."* Future passes: adjacent-work hints ("Read next:
// [[work-b]]") once the graph is rich enough. Held in BACKLOG.md.
export function WorkOutwardInvitation({
  roomPath,
  roomLabel,
  facets,
  backlinks,
}: WorkOutwardInvitationProps) {
  return (
    <>
      <Ornament className="mt-work-break sm:mt-work-break-md" />
      <div className="mt-room-rhythm font-body text-list leading-closing italic text-text-2">
        {facets.length > 0 && <FacetThreadsLine facets={facets} />}
        {backlinks.length > 0 && <BacklinksLine backlinks={backlinks} />}
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

function BacklinksLine({ backlinks }: { backlinks: readonly BacklinkRef[] }) {
  return (
    <p className="mb-2">
      Mentioned in{' '}
      {formatSeries(backlinks, (b) => (
        <Link
          to="/$room/$slug"
          params={{ room: b.room, slug: b.slug }}
          className="border-b border-transparent text-text-2 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text"
        >
          {b.title}
        </Link>
      ))}
      .
    </p>
  );
}

function FacetThreadsLine({ facets }: { facets: readonly Facet[] }) {
  return (
    <p className="mb-2">
      Also threaded through{' '}
      {formatSeries(facets, (facet) => (
        <Link
          to="/facet/$facet"
          params={{ facet }}
          className="border-b border-transparent text-text-2 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text"
        >
          {facet}
        </Link>
      ))}
      .
    </p>
  );
}
