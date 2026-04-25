import { describe, expect, it } from 'vitest';
import { getDisplayWorkSync, getDisplayWorksByRoomSync } from './display';
import { isPreviewWork } from './preview';

describe('display content fallback', () => {
  it('uses sample preview works for empty rooms', () => {
    const works = getDisplayWorksByRoomSync('studio');

    expect(works.length).toBeGreaterThanOrEqual(4);
    expect(works.every(isPreviewWork)).toBe(true);
    expect(works[0]?.preview?.roomNote).toContain('Sample preview entries');
  });

  it('yields to authored works as soon as a room has content', () => {
    const works = getDisplayWorksByRoomSync('garden');

    expect(works).toHaveLength(1);
    expect(isPreviewWork(works[0]!)).toBe(false);
    expect(works[0]?.slug).toBe('small-weather');
  });

  it('finds preview work detail only when the room has no authored works', () => {
    const studioWork = getDisplayWorkSync('studio', 'containers-not-pipelines');
    const gardenPreviewAttempt = getDisplayWorkSync('garden', 'inheritance-in-three-movements');

    expect(studioWork && isPreviewWork(studioWork)).toBe(true);
    expect(gardenPreviewAttempt).toBeUndefined();
  });
});
