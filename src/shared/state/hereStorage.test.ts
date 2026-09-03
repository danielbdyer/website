import { beforeEach, describe, expect, test } from 'vitest';
import { HERE_STORAGE_KEY, persistHere, readPersistedHere } from './hereStorage';

describe('here — session persistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('round-trips the place the visitor stands at', () => {
    persistHere('garden/small-weather');
    expect(readPersistedHere()).toBe('garden/small-weather');
  });

  test('returns null when nothing is stored', () => {
    expect(readPersistedHere()).toBeNull();
  });

  test('rejects an empty or absurdly long value', () => {
    sessionStorage.setItem(HERE_STORAGE_KEY, '');
    expect(readPersistedHere()).toBeNull();
    sessionStorage.setItem(HERE_STORAGE_KEY, 'x'.repeat(400));
    expect(readPersistedHere()).toBeNull();
  });
});
