import { useTheme } from '@/app/providers';
import { SunIcon } from '@/shared/atoms/SunIcon/SunIcon';
import { MoonIcon } from '@/shared/atoms/MoonIcon/MoonIcon';

export function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="bg-transparent border-none text-text-3 cursor-pointer p-[5px] flex items-center transition-colors duration-200 rounded hover:text-text hover:bg-tag-bg"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
