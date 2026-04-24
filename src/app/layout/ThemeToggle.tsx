import { useTheme } from '@/app/providers';
import { SunIcon } from '@/shared/atoms/SunIcon/SunIcon';
import { MoonIcon } from '@/shared/atoms/MoonIcon/MoonIcon';

// Per RESPONSIVE_STRATEGY.md, interactive elements are ≥44×44 CSS
// pixels. Touch targets can overlap invisibly — a small visible pill
// carries a larger tap region by extending the button's bounds
// beyond the visible chrome. The outer <button> is the 44×44 tap
// region; the inner <span> is the visible chrome that picks up the
// hover tint at icon scale.
export function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="group flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center border-none bg-transparent"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="flex items-center rounded p-[5px] text-text-3 transition-colors duration-200 group-hover:bg-tag-bg group-hover:text-text">
        {dark ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
