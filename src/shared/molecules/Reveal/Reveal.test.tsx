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

  it('renders children in the pre-reveal state', () => {
    const { container, getByText } = render(
      <Reveal>
        <span>hello</span>
      </Reveal>,
    );
    expect(getByText('hello')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('opacity-0');
    expect(container.firstChild).toHaveClass('translate-y-[14px]');
    expect(container.firstChild).not.toHaveClass('opacity-100');
  });

  it('adds the revealed class once the child intersects', () => {
    const { container } = render(
      <Reveal>
        <span>hello</span>
      </Reveal>,
    );
    observers[0]!.fire(true);
    expect(container.firstChild).toHaveClass('opacity-100');
    expect(container.firstChild).toHaveClass('translate-y-0');
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
