import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DUSK_MS, useDusk } from './useDusk';

describe('useDusk — the frame carries the dusk while the hour turns', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('a mount is not a turn: no dusk on the first render, whatever the hour', () => {
    const { result } = renderHook(() => useDusk('night'));
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(DUSK_MS + 10);
    });
    expect(result.current).toBe(false);
  });

  test('the hour turning opens the dusk, which closes on its own after the arc', () => {
    const { result, rerender } = renderHook(({ hour }) => useDusk(hour), {
      initialProps: { hour: 'day' as 'day' | 'night' },
    });
    rerender({ hour: 'night' });
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(DUSK_MS - 50);
    });
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);
  });

  test('a second turn inside the arc keeps the dusk open for a full arc from the later turn', () => {
    const { result, rerender } = renderHook(({ hour }) => useDusk(hour), {
      initialProps: { hour: 'day' as 'day' | 'night' },
    });
    rerender({ hour: 'night' });
    act(() => {
      vi.advanceTimersByTime(DUSK_MS - 200);
    });
    rerender({ hour: 'day' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(DUSK_MS);
    });
    expect(result.current).toBe(false);
  });
});
