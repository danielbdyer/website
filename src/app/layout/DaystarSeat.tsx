import { useTheme } from '@/app/providers';
import { MoonIcon } from '@/shared/atoms/MoonIcon/MoonIcon';
import { SunIcon } from '@/shared/atoms/SunIcon/SunIcon';

// The daystar's seat — the fixed element that takes the nav glyph's
// place while the eye moves (dom/daystarSeat.ts): the same icon, the
// hour's own, at the icon's rest, rising through the lift to where the
// sky seats its daystar and carrying the transition's name there, and
// coming back down on the way home. Outside the stage, so the falling
// page leaves it where it is. Hidden until the seat is taken.
export function DaystarSeat() {
  const { dark } = useTheme();
  return (
    <div className="daystar-seat text-text-3" aria-hidden="true">
      {dark ? <MoonIcon /> : <SunIcon />}
    </div>
  );
}
