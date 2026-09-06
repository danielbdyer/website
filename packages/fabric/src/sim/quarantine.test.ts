import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compounding, fabricIssues, parseEvent, project } from '../index';
import { isAgent } from '../schema';
import {
  SYNTHETIC_ACTOR,
  containsSynthetic,
  driveRun,
  fileHandle,
  isSynthetic,
  memoryHandle,
  quarantined,
} from './index';

// ─── The firewall (charter §1) ────────────────────────────────────
//
// Synthetic proof must never pollute the real measurement. Two
// guarantees hold it: every synthetic event is `import:synthetic`, and
// the real read path is a different set of files it can never reach.
// Both are checked here, and the loop's closing is proven on the real
// file adapter so the plumbing claim rests on real storage.

const SMALL = { seed: 'q', seeds: 10, queries: 14, hubs: 3, missRate: 0.15 };

describe('the actor firewall', () => {
  it('writes a synthetic run entirely as import:synthetic, never as an agent', async () => {
    const { events, compounding: measure } = await driveRun(SMALL, 1, memoryHandle());
    expect(events.length).toBeGreaterThan(0);
    expect(quarantined(events)).toBe(true);
    expect(events.every((event) => event.actor === SYNTHETIC_ACTOR)).toBe(true);
    expect(events.some((event) => isAgent(event.actor))).toBe(false);
    // The loop closes: retrievals were made and later citations used them.
    expect(measure.retrievals).toBeGreaterThan(0);
    expect(measure.used).toBeGreaterThan(0);
  });

  it('tells a synthetic event from a real one, both ways', () => {
    expect(isSynthetic(SYNTHETIC_ACTOR)).toBe(true);
    expect(isSynthetic('agent:session/1')).toBe(false);
    expect(isSynthetic('runtime')).toBe(false);
    const real = [{ actor: 'runtime' }, { actor: 'agent:session/1' }, { actor: 'author:danny' }];
    expect(containsSynthetic(real)).toBe(false);
    expect(containsSynthetic([...real, { actor: SYNTHETIC_ACTOR }])).toBe(true);
  });
});

describe('the real measurement stays clean', () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

  it('folds the committed real log to a synthetic-free R(t) of 0 of 0', async () => {
    const dir = path.join(repoRoot, 'fabric', 'spaces');
    const files = ['danny.jsonl', 'agent.jsonl'];
    const perFile = await Promise.all(
      files.map(async (file) => {
        const text = await readFile(path.join(dir, file), 'utf8');
        return text
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => parseEvent(JSON.parse(line) as unknown));
      }),
    );
    const real = perFile.flat();
    expect(containsSynthetic(real)).toBe(false);
    const measure = compounding(project(real));
    expect(measure.retrievals).toBe(0);
    expect(measure.rate).toBeUndefined();
  });
});

describe('the real file adapter (charter §2)', () => {
  let dir = '';
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'fabric-sim-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('closes the loop through real files and round-trips to the same projection', async () => {
    const tiny = { seed: 'f', seeds: 6, queries: 8, hubs: 2, missRate: 0.15 };
    const { events, compounding: measure } = await driveRun(tiny, 1, fileHandle(dir));
    expect(measure.used).toBeGreaterThan(0);
    expect(quarantined(events)).toBe(true);
    // Provenance-rich correctness: the log breaks no invariant.
    expect(fabricIssues(events)).toEqual([]);
    // A fresh reader over the same directory yields the same projection:
    // export → fresh process → import → identical state (INV-FAB-005).
    const reread = await fileHandle(dir).read();
    expect(project(reread)).toEqual(project(events));
  });
});
