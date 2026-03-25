import { createContext, useContext, useSyncExternalStore } from 'react';
import { themeStore } from './theme-store';

interface ThemeContextValue {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dark = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  return <ThemeContext value={{ dark, toggle: themeStore.toggle }}>{children}</ThemeContext>;
}
