/**
 * External store for theme state.
 *
 * Owns localStorage reads/writes and DOM class synchronization.
 * React subscribes via useSyncExternalStore — no effects needed.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) listener();
}

function isDark(): boolean {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    // No explicit preference stored — honor the system preference.
    // ACCESSIBILITY.md commits to prefers-color-scheme as the default
    // until the visitor makes an explicit choice via the toggle.
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch {
    return false;
  }
}

function applyToDOM(dark: boolean) {
  document.documentElement.classList.toggle('dk', dark);
  document.documentElement.classList.toggle('lt', !dark);
}

// Set DOM state on module load — before React renders, no flash.
applyToDOM(isDark());

export const themeStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): boolean {
    return isDark();
  },

  getServerSnapshot(): boolean {
    return false;
  },

  toggle() {
    const next = !isDark();
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Storage full or unavailable — toggle still works in-memory for this session
    }
    applyToDOM(next);
    emitChange();
  },
};
