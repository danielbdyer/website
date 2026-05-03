import { afterEach, describe, expect, test } from 'vitest';
import {
  ATMOSPHERIC_STAR_CAPACITY,
  STAR_STRIDE,
  getAtmosphericScene,
  resetAtmosphericScene,
  setAtmosphericStarMetadata,
  setAtmosphericStarPosition,
} from './atmosphericScene';

afterEach(() => {
  resetAtmosphericScene();
});

describe('atmospheric scene signal', () => {
  test('starts empty — count is zero, buffer is zeroed', () => {
    const scene = getAtmosphericScene();
    expect(scene.count).toBe(0);
    expect(scene.buffer.every((v) => v === 0)).toBe(true);
  });

  test('metadata write seeds hue + phase, leaves positions zeroed', () => {
    setAtmosphericStarMetadata([
      { hueIndex: 0, phase: 1.2 },
      { hueIndex: 2, phase: 3.4 },
    ]);
    const { buffer, count } = getAtmosphericScene();
    expect(count).toBe(2);
    expect(buffer[0]).toBe(0); // x
    expect(buffer[1]).toBe(0); // y
    expect(buffer[2]).toBe(0); // hueIndex
    expect(buffer[3]).toBeCloseTo(1.2, 5); // phase (Float32 round-trip)
    expect(buffer[STAR_STRIDE + 2]).toBe(2);
    expect(buffer[STAR_STRIDE + 3]).toBeCloseTo(3.4, 5);
  });

  test('position write updates only the (x, y) slots, preserves metadata', () => {
    setAtmosphericStarMetadata([{ hueIndex: 1, phase: 2.5 }]);
    setAtmosphericStarPosition(0, 0.3, -0.7);
    const { buffer } = getAtmosphericScene();
    // Float32 precision: round-trip drops a few low bits.
    expect(buffer[0]).toBeCloseTo(0.3, 5);
    expect(buffer[1]).toBeCloseTo(-0.7, 5);
    expect(buffer[2]).toBe(1);
    expect(buffer[3]).toBe(2.5);
  });

  test('writes beyond capacity truncate silently', () => {
    const oversized = Array.from({ length: ATMOSPHERIC_STAR_CAPACITY + 5 }, (_, i) => ({
      hueIndex: i % 4,
      phase: i,
    }));
    setAtmosphericStarMetadata(oversized);
    const { count } = getAtmosphericScene();
    expect(count).toBe(ATMOSPHERIC_STAR_CAPACITY);
  });

  test('out-of-range position writes are no-ops', () => {
    setAtmosphericStarMetadata([{ hueIndex: 0, phase: 0 }]);
    setAtmosphericStarPosition(-1, 1, 1);
    setAtmosphericStarPosition(ATMOSPHERIC_STAR_CAPACITY, 1, 1);
    const { buffer } = getAtmosphericScene();
    expect(buffer[0]).toBe(0);
    expect(buffer[1]).toBe(0);
  });

  test('shrinking the graph zeros the old tail', () => {
    setAtmosphericStarMetadata([
      { hueIndex: 1, phase: 1 },
      { hueIndex: 2, phase: 2 },
      { hueIndex: 3, phase: 3 },
    ]);
    setAtmosphericStarPosition(2, 0.5, 0.25);
    setAtmosphericStarMetadata([{ hueIndex: 0, phase: 0 }]);
    const { buffer, count } = getAtmosphericScene();
    expect(count).toBe(1);
    // The third slot (the one that was filled) should be zeroed:
    expect(buffer[STAR_STRIDE * 2]).toBe(0);
    expect(buffer[STAR_STRIDE * 2 + 1]).toBe(0);
  });

  test('reset zeroes everything', () => {
    setAtmosphericStarMetadata([{ hueIndex: 1, phase: 2.5 }]);
    setAtmosphericStarPosition(0, 0.3, -0.7);
    resetAtmosphericScene();
    const scene = getAtmosphericScene();
    expect(scene.count).toBe(0);
    expect(scene.buffer.every((v) => v === 0)).toBe(true);
  });
});
