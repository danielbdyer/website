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
// The icon-bearing span carries the `daystar` view-transition name —
// the same name applied to the constellation's celestial body on
// /sky. When the visitor navigates from any non-/sky route to /sky,
// the View Transitions API morphs the small corner icon into the
// large firmament daystar; on return, the morph runs in reverse.
// Uniqueness is preserved by the layout: /sky hides the Nav so the
// toggle is not present there, and other routes have no firmament.
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
        className="text-text-3 group-hover:bg-tag-bg group-hover:text-text flex items-center rounded p-[5px] transition-colors duration-200"
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
