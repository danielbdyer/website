import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { useReveal } from './use-reveal';

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  element: Element | null = null;
  observe = vi.fn((el: Element) => {
    this.element = el;
  });
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
  root: Element | Document | null = null;
  rootMargin = '';
  thresholds: number[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observers.push(this);
  }

  fire(isIntersecting: boolean) {
    const entry = { isIntersecting, target: this.element } as unknown as IntersectionObserverEntry;
    act(() => {
      this.callback([entry], this as unknown as IntersectionObserver);
    });
  }
}

let observers: MockIntersectionObserver[] = [];
const originalIO = globalThis.IntersectionObserver;

function TestHarness() {
  const [ref, visible] = useReveal();
  return <div ref={ref} data-testid="target" data-visible={visible} />;
}

describe('useReveal', () => {
  beforeEach(() => {
    observers = [];
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIO;
    vi.restoreAllMocks();
  });

  it('starts not visible', () => {
    const { getByTestId } = render(<TestHarness />);
    expect(getByTestId('target').getAttribute('data-visible')).toBe('false');
  });

  it('observes the ref element on mount', () => {
    const { getByTestId } = render(<TestHarness />);
    const target = getByTestId('target');
    expect(observers).toHaveLength(1);
    expect(observers[0]!.observe).toHaveBeenCalledWith(target);
  });

  it('becomes visible when the element intersects', () => {
    const { getByTestId } = render(<TestHarness />);
    observers[0]!.fire(true);
    expect(getByTestId('target').getAttribute('data-visible')).toBe('true');
  });

  it('disconnects the observer after first intersection', () => {
    render(<TestHarness />);
    observers[0]!.fire(true);
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });

  it('stays invisible if the element never intersects', () => {
    const { getByTestId } = render(<TestHarness />);
    observers[0]!.fire(false);
    expect(getByTestId('target').getAttribute('data-visible')).toBe('false');
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(<TestHarness />);
    unmount();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });
});
