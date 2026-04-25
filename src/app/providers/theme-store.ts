/**
 * External store for theme state.
 *
 * Owns localStorage reads/writes and DOM class synchronization.
 * React subscribes via useSyncExternalStore — no effects needed.
 *
 * Also listens to two external signals so the site stays coherent
 * without the visitor having to refresh:
 *
 * - `matchMedia('(prefers-color-scheme: dark)')` — if the visitor
 *   has no explicit stored preference, the system setting is the
 *   source of truth, and it should respond to changes (e.g., macOS
 *   sunset mode) in real time.
 *
 * - `storage` event — when the visitor has two tabs open and toggles
 *   in one, the other tab rehydrates from localStorage.
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

// Module-level side effects guarded for SSR: under prerender the module
// loads on Node, where `document` and `window` are undefined. The theme
// class on <html> is applied pre-paint by the inline init script in
// __root.tsx's <head>; this module reapplies on hydration to keep the
// class authoritative once React owns the page, then subscribes to
// system + storage events so the site stays coherent across tabs and
// macOS sunset mode without a refresh.
if (typeof document !== 'undefined') {
  applyToDOM(isDark());

  // Reactivity to the system preference, when no explicit choice is stored.
  // Uses optional chaining because jsdom (tests) may not implement matchMedia.
  const systemPreference = window.matchMedia?.('(prefers-color-scheme: dark)');
  systemPreference?.addEventListener?.('change', () => {
    const stored = (() => {
      try {
        return localStorage.getItem('theme');
      } catch {
        return null;
      }
    })();
    // Only follow the system when there's no explicit stored choice.
    if (stored === 'dark' || stored === 'light') return;
    applyToDOM(isDark());
    emitChange();
  });

  // Reactivity across tabs. Another tab writes to localStorage; this one picks it up.
  window.addEventListener?.('storage', (e) => {
    if (e.key !== 'theme') return;
    applyToDOM(isDark());
    emitChange();
  });
}

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
