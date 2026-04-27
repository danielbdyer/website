import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { themeStore } from './theme-store';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dk', 'lt');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('defaults to light when no preference is stored and system is light', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    expect(themeStore.getSnapshot()).toBe(false);
  });

  it('honors prefers-color-scheme: dark when no explicit theme is stored', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('dark'),
      })),
    );
    expect(themeStore.getSnapshot()).toBe(true);
  });

  it('explicit stored "light" wins over system dark preference', () => {
    localStorage.setItem('theme', 'light');
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    expect(themeStore.getSnapshot()).toBe(false);
  });

  it('toggles to dark and persists to localStorage', () => {
    themeStore.toggle();
    expect(themeStore.getSnapshot()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dk')).toBe(true);
    expect(document.documentElement.classList.contains('lt')).toBe(false);
  });

  it('toggles back to light', () => {
    themeStore.toggle();
    themeStore.toggle();
    expect(themeStore.getSnapshot()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('lt')).toBe(true);
  });

  it('notifies subscribers on toggle and stops after unsubscribe', () => {
    let calls = 0;
    const unsubscribe = themeStore.subscribe(() => {
      calls++;
    });
    themeStore.toggle();
    expect(calls).toBe(1);
    themeStore.toggle();
    expect(calls).toBe(2);
    unsubscribe();
    themeStore.toggle();
    expect(calls).toBe(2);
  });

  it('getServerSnapshot returns false for SSR safety', () => {
    expect(themeStore.getServerSnapshot()).toBe(false);
  });

  it('responds to storage events from other tabs', () => {
    let calls = 0;
    const unsubscribe = themeStore.subscribe(() => {
      calls++;
    });

    // Simulate another tab toggling to dark.
    localStorage.setItem('theme', 'dark');
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme' }));

    expect(calls).toBe(1);
    expect(themeStore.getSnapshot()).toBe(true);
    expect(document.documentElement.classList.contains('dk')).toBe(true);

    unsubscribe();
  });

  it('ignores storage events for unrelated keys', () => {
    let calls = 0;
    const unsubscribe = themeStore.subscribe(() => {
      calls++;
    });

    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }));

    expect(calls).toBe(0);
    unsubscribe();
  });
});
