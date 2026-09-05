import { Suspense, lazy, useSyncExternalStore } from 'react';
import { useTheme } from '@/app/providers';
import { MoonIcon } from '@/shared/atoms/MoonIcon/MoonIcon';
import { SunIcon } from '@/shared/atoms/SunIcon/SunIcon';
import { seatMode, subscribeSeat, type SeatMode } from '@/shared/dom/daystarSeat';

// The daystar's seat — the fixed element that stands for the nav's
// glyph while the eye moves (dom/daystarSeat.ts). On the way up it
// holds the character itself — the daystar, face and painted body and
// all — where the sky will seat it, appearing as the falling page
// uncovers that place, and the character carries the transition's
// name, so the route's transition crosses face to face. On the way
// down it holds the hour's icon at the glyph's own rest, so the face
// has somewhere exact to land. Outside the stage, so the falling page
// leaves it where it is. The character's module is the sky's own,
// fetched only when the seat first holds it (the Foyer's readiness has
// it cached by then), never on any page's arrival.
const Character = lazy(() => import('@/shared/molecules/Daystar/character'));

const none = (): SeatMode => 'none';

export function DaystarSeat() {
  const { dark } = useTheme();
  const mode = useSyncExternalStore(subscribeSeat, seatMode, none);
  return (
    <div className={`daystar-seat daystar-seat--${mode} text-text-3`} aria-hidden="true">
      {mode === 'sky' && (
        <Suspense fallback={null}>
          <Character />
        </Suspense>
      )}
      {mode === 'rest' && (dark ? <MoonIcon /> : <SunIcon />)}
    </div>
  );
}
