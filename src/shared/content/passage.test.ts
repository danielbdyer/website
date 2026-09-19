import { describe, expect, test } from 'vitest';
import { PASSAGE, passageFrom } from './passage';

describe('the passage', () => {
  test('leaves from one star only', () => {
    expect(passageFrom('garden/small-weather')).toBe(PASSAGE);
    expect(passageFrom('pole')).toBeNull();
    expect(passageFrom('studio/containers')).toBeNull();
  });

  test('leads off the chart', () => {
    expect(PASSAGE.to).toBe('/scale');
    expect(PASSAGE.line).toBe('off the chart');
  });
});
