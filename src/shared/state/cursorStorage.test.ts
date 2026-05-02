import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { sphericalToUnit } from '@/shared/geometry/sphere';
import {
  CURSOR_STORAGE_KEY,
  VISIT_MANIFEST_KEY,
  hasVisitedBefore,
  markVisited,
  persistCursorPos,
  readPersistedCursorPos,
} from './cursorStorage';

describe('cursor session persistence', () => {
  beforeEach(() => {
    globalThis.sessionStorage?.clear();
  });

  afterEach(() => {
    globalThis.sessionStorage?.clear();
  });

  test('roundtrip — persisted unit vector reads back as the same point', () => {
    const pos = sphericalToUnit({ theta: 0.4, phi: 1.2 });
    persistCursorPos(pos);
    const restored = readPersistedCursorPos();
    expect(restored).not.toBeNull();
    expect(restored!.x).toBeCloseTo(pos.x, 6);
    expect(restored!.y).toBeCloseTo(pos.y, 6);
    expect(restored!.z).toBeCloseTo(pos.z, 6);
  });

  test('returns null when no value has been stored', () => {
    expect(readPersistedCursorPos()).toBeNull();
  });

  test('rejects values whose magnitude is not on the unit sphere', () => {
    // A value that parses as {x,y,z} but isn't a unit vector — guard
    // against corrupt or schema-drifted storage.
    globalThis.sessionStorage?.setItem(CURSOR_STORAGE_KEY, JSON.stringify({ x: 5, y: 5, z: 5 }));
    expect(readPersistedCursorPos()).toBeNull();
  });

  test('returns null on malformed JSON', () => {
    globalThis.sessionStorage?.setItem(CURSOR_STORAGE_KEY, 'not-json');
    expect(readPersistedCursorPos()).toBeNull();
  });

  test('returns null when the schema is missing a coordinate', () => {
    globalThis.sessionStorage?.setItem(CURSOR_STORAGE_KEY, JSON.stringify({ x: 0, y: 0 }));
    expect(readPersistedCursorPos()).toBeNull();
  });
});

describe('first-visit manifest', () => {
  beforeEach(() => {
    globalThis.localStorage?.removeItem(VISIT_MANIFEST_KEY);
  });

  afterEach(() => {
    globalThis.localStorage?.removeItem(VISIT_MANIFEST_KEY);
  });

  test('returns false when no prior visit has been marked', () => {
    expect(hasVisitedBefore()).toBe(false);
  });

  test('roundtrip — markVisited makes hasVisitedBefore return true', () => {
    markVisited();
    expect(hasVisitedBefore()).toBe(true);
  });

  test('returns false on a corrupt manifest value', () => {
    globalThis.localStorage?.setItem(VISIT_MANIFEST_KEY, 'not-true');
    expect(hasVisitedBefore()).toBe(false);
  });
});
