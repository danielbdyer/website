import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Reveal } from './Reveal';

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

// Reveal calls getBoundingClientRect on the wrapper div to decide whether
// to start hidden or stay visible. jsdom returns zeros for every rect, so
// to exercise the below-the-fold path we monkey-patch the prototype for
// the duration of one test and restore it after.
function withBelowFoldRects<T>(fn: () => T): T {
  const original = HTMLDivElement.prototype.getBoundingClientRect;
  HTMLDivElement.prototype.getBoundingClientRect = function () {
    return {
      top: window.innerHeight + 100,
      left: 0,
      right: 0,
      bottom: window.innerHeight + 200,
      width: 0,
      height: 100,
      x: 0,
      y: window.innerHeight + 100,
      toJSON: () => ({}),
    };
  };
  try {
    return fn();
  } finally {
    HTMLDivElement.prototype.getBoundingClientRect = original;
  }
}

describe('Reveal', () => {
  beforeEach(() => {
    observers = [];
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIO;
    vi.restoreAllMocks();
  });

  it('renders children visible by default — SSR/no-JS sees content immediately', () => {
    const { container, getByText } = render(
      <Reveal>
        <span>hello</span>
      </Reveal>,
    );
    expect(getByText('hello')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('opacity-100');
    expect(container.firstChild).toHaveClass('translate-y-0');
    expect(container.firstChild).not.toHaveClass('opacity-0');
  });

  it('above-the-fold content stays visible after mount and never observes', () => {
    const { container } = render(
      <Reveal>
        <span>hello</span>
      </Reveal>,
    );
    expect(observers).toHaveLength(0);
    expect(container.firstChild).toHaveClass('opacity-100');
  });

  it('below-the-fold content hides on mount and reveals on intersection', () => {
    withBelowFoldRects(() => {
      const { container } = render(
        <Reveal>
          <span>hi</span>
        </Reveal>,
      );
      expect(container.firstChild).toHaveClass('opacity-0');
      expect(observers).toHaveLength(1);
      observers[0]!.fire(true);
      expect(container.firstChild).toHaveClass('opacity-100');
      expect(container.firstChild).toHaveClass('translate-y-0');
      expect(observers[0]!.disconnect).toHaveBeenCalled();
    });
  });

  it('applies delay as a CSS transition-delay', () => {
    const { container } = render(
      <Reveal delay={200}>
        <span>hi</span>
      </Reveal>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.transitionDelay).toBe('200ms');
  });

  it('forwards custom className', () => {
    const { container } = render(
      <Reveal className="extra">
        <span>hi</span>
      </Reveal>,
    );
    expect(container.firstChild).toHaveClass('extra');
  });
});
