import '@testing-library/jest-dom/vitest';

// jsdom does not implement IntersectionObserver. Default to a no-op implementation
// so components using <Reveal /> can render without each test wiring a mock.
// Tests that want to drive intersection behavior (Reveal) override this locally
// with a class that records state and exposes a fire() helper.
class NoOpIntersectionObserver {
  callback: IntersectionObserverCallback;
  observe = () => {};
  disconnect = () => {};
  unobserve = () => {};
  takeRecords = () => [] as IntersectionObserverEntry[];
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
}

globalThis.IntersectionObserver =
  NoOpIntersectionObserver as unknown as typeof IntersectionObserver;
