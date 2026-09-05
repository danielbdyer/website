import { useTheme } from '@/app/providers';
import { SunIcon } from '@/shared/atoms/SunIcon/SunIcon';
import { MoonIcon } from '@/shared/atoms/MoonIcon/MoonIcon';
import { DAYSTAR_TRANSITION_NAME } from '@/shared/utils/view-transition-names';

// Per RESPONSIVE_STRATEGY.md, interactive elements are ≥44×44 CSS
// pixels. Touch targets can overlap invisibly — a small visible pill
// carries a larger tap region by extending the button's bounds
// beyond the visible chrome. The outer <button> is the 44×44 tap
// region; the inner <span> is the visible chrome that picks up the
// hover tint at icon scale.
//
// The glyph shows the hour the room keeps — the sun by day, the moon
// by night — and the label says what a click does. The icon-bearing
// span carries the `daystar` view-transition name, the same name the
// constellation's daystar carries on /sky. When the visitor looks up
// from a room, the View Transitions API morphs this small glyph into
// the daystar's face on its way to the sky's margin — the same being,
// grown into its place — and on return the face descends into the
// corner. Showing the current hour is what lets the morph read as one
// body: the moon rises at night. Uniqueness is preserved by the
// layout: /sky hides the Nav, and other routes have no firmament. The
// glyph also readies itself with the Foyer's look-up pull (--reveal on
// the root, tokens.css). CONSTELLATION.md §"The Sun and the Moon".
export function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="group min-h-touch min-w-touch flex cursor-pointer items-center justify-center border-none bg-transparent"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        style={{ viewTransitionName: DAYSTAR_TRANSITION_NAME }}
        className="theme-toggle__glyph text-text-3 group-hover:bg-tag-bg group-hover:text-text flex items-center rounded p-[5px] transition-colors duration-200"
      >
        {dark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}
