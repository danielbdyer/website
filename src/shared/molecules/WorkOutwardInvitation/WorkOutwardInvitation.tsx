import { Link } from '@tanstack/react-router';
import type { Room } from '@/shared/types/common';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';

interface WorkOutwardInvitationProps {
  room: Room;
  roomPath: '/' | `/${Exclude<Room, 'foyer'>}`;
  roomLabel: string;
}

// The outward invitation at the bottom of every work — `GRAPH_AND_LINKING.md`
// commits to "no work ends at its own last line." A subtle Ornament marks
// the section break, then the closing gesture invites the visitor back
// into the room. The Ornament gets a generous gap so the work's last
// line gets a full breath before the section break arrives; the closing
// line then sits at a moderate distance below — the gesture feels
// anchored, not abandoned.
//
// Future passes here: backlinks, facet thread reminders, both held in
// BACKLOG.md and unblocked by GRAPH_AND_LINKING wikilink resolution.
export function WorkOutwardInvitation({ roomPath, roomLabel }: WorkOutwardInvitationProps) {
  return (
    <>
      <Ornament className="mt-work-break sm:mt-work-break-md" />
      <div className="mt-room-rhythm font-body text-list leading-closing italic text-text-2">
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
