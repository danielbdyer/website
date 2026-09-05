import { useTheme } from '@/app/providers';
import { MoonIcon } from '@/shared/atoms/MoonIcon/MoonIcon';
import { SunIcon } from '@/shared/atoms/SunIcon/SunIcon';

// The daystar's seat — the fixed element that stands for the nav's
// glyph while the eye moves (dom/daystarSeat.ts): the same icon, the
// hour's own. On the way up it appears in the sky where the daystar
// will be, fading in as the room falls, and carries the transition's
// name there; on the way down it stands at the glyph's own rest so the
// face has somewhere exact to land. Outside the stage, so the falling
// page leaves it where it is. Hidden until the seat is taken.
export function DaystarSeat() {
  const { dark } = useTheme();
  return (
    <div className="daystar-seat text-text-3" aria-hidden="true">
      {dark ? <MoonIcon /> : <SunIcon />}
    </div>
  );
}
