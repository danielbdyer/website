import { cn } from '@/shared/utils/cn';
import type { Room } from '@/shared/types/common';

interface RoomGlyphProps {
  room: Room;
  className?: string;
}

// Each room can carry a quiet umber-toned mark that fills in when a work
// has no thumb of its own. The mark reads as "a work in this room," not as
// "image missing." For now only the Salon's glyph (a circle resting in a
// square frame) earns its keep — the Salon is the room whose works carry
// images. Other rooms render no glyph because their image-rows variant
// hasn't been called for yet; if they later opt in, this atom is the place
// to add their marks.
export function RoomGlyph({ room, className }: RoomGlyphProps) {
  if (room !== 'salon') return null;
  return (
    <div className={cn('h-full w-full', className)} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="block w-full h-full">
        <g fill="none" stroke="var(--text-3)" strokeWidth="0.6" opacity="0.55">
          <rect x="22" y="22" width="56" height="56" />
          <circle cx="50" cy="50" r="16" />
          <circle cx="50" cy="50" r="2" fill="var(--text-3)" stroke="none" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
