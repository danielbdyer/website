import { useTheme } from '@/app/providers';
import { SunIcon } from '@/shared/atoms/SunIcon/SunIcon';
import { MoonIcon } from '@/shared/atoms/MoonIcon/MoonIcon';

export function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="bg-transparent border-none text-[var(--text-3)] cursor-pointer p-[5px] flex items-center transition-colors duration-200 rounded hover:text-[var(--text)] hover:bg-[var(--tag-bg)]"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
