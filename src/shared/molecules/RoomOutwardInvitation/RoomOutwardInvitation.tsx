import { Link } from '@tanstack/react-router';
import type { Facet, Room } from '@/shared/types/common';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { formatSeries } from '@/shared/utils/format-series';

interface RoomOutwardInvitationProps {
  /** Two or three facet threads this room threads through — surfaces as
   *  inline links inviting the visitor to follow the thread cross-room.
   *  Editorial choice per room; not algorithmic. */
  threads: readonly Facet[];
  /** Optional adjacent-room hint — "Or wander into *Room* →". Renders
   *  beneath the threads line. */
  toward?: { path: `/${Exclude<Room, 'foyer'>}` | '/'; label: string };
}

// The outward invitation at the bottom of every room landing.
// `INFORMATION_ARCHITECTURE.md`:
//   *"An invitation outward — at the bottom, a small nudge toward an
//   adjacent room or a facet thread. No room ends with 'nothing more
//   here'; there is always a door."*
//
// Same shape as `WorkOutwardInvitation` (Ornament + voice-italic lines)
// so the two surfaces feel like the same gesture. Differences:
//   - Threads are *editorial* per room (not derived from a single work's
//     facets). Each room's voice elects one or two threads to surface.
//   - There is no "return to the room you came from" — visitors arrive
//     at room landings without a from-room context. Instead, the optional
//     `toward` prop names an adjacent room as a wandering hint.
export function RoomOutwardInvitation({ threads, toward }: RoomOutwardInvitationProps) {
  return (
    <>
      <Ornament className="mt-work-break sm:mt-work-break-md" />
      <div className="mt-room-rhythm font-body text-list leading-closing italic text-text-2">
        {threads.length > 0 && <ThreadsLine facets={threads} />}
        {toward && (
          <p className="mb-2">
            Or wander into{' '}
            <Link
              to={toward.path}
              className="border-b border-transparent text-text-2 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text"
            >
              {toward.label}
            </Link>{' '}
            →
          </p>
        )}
      </div>
    </>
  );
}

function ThreadsLine({ facets }: { facets: readonly Facet[] }) {
  return (
    <p className="mb-2">
      Threaded through{' '}
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
