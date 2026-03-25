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
    return localStorage.getItem('theme') === 'dark';
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
