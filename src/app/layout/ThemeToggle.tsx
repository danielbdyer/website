import { useTheme } from '@/app/providers';
import { SunIcon } from '@/shared/atoms/SunIcon/SunIcon';
import { MoonIcon } from '@/shared/atoms/MoonIcon/MoonIcon';

// Per RESPONSIVE_STRATEGY.md, interactive elements are ≥44×44 CSS
// pixels. Touch targets can overlap invisibly — a small visible pill
// carries a larger tap region by extending the button's bounds
// beyond the visible chrome. The outer <button> is the 44×44 tap
// region; the inner <span> is the visible chrome that picks up the
// hover tint at icon scale.
//
// The glyph shows the hour the room keeps — the sun by day, the moon
// by night — and the label says what a click does. The icon-bearing
// span carries the `daystar` view-transition name at rest (tokens.css
// §"The daystar's seat"), the same name the constellation's daystar
// carries on /sky, and gives it to its seat the moment the Foyer's
// look-up begins (dom/daystarSeat.ts): the seat rises to the sky's
// margin and the View Transitions API turns it there into the
// daystar's face — the same being, grown into its place — and on
// return the face turns back and comes down into the corner. Showing
// the current hour is what lets the morph read as one body: the moon
// rises at night. Uniqueness is preserved by the layout: /sky hides
// the Nav, and other routes have no firmament. CONSTELLATION.md §"The
// Sun and the Moon".
export function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="group min-h-touch min-w-touch flex cursor-pointer items-center justify-center border-none bg-transparent"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle__glyph text-text-3 group-hover:bg-tag-bg group-hover:text-text flex items-center rounded p-[5px] transition-colors duration-200">
        {dark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}
