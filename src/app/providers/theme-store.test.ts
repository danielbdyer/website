import { describe, it, expect, beforeEach } from 'vitest';
import { themeStore } from './theme-store';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dk', 'lt');
  });

  it('defaults to light when no preference is stored', () => {
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
});
