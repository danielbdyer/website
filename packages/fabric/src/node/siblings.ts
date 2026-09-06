import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { Effect, Layer } from 'effect';
import { Siblings, type Sibling, type SiblingsService } from '../verbs';

// ─── The siblings, through git ────────────────────────────────────
//
// A submodule pin is a weak reference: a citation by hash to a node in
// another space, written on the relating node. `sync` reads the pins
// and asks each remote where its default branch is now. It moves
// nothing.

const run = promisify(execFile);

interface Pin {
  readonly path: string;
  readonly url: string;
}

/** The `[submodule "x"]` blocks of `.gitmodules`, as path and url. */
export function parseGitmodules(text: string): readonly Pin[] {
  const blocks = text.split(/^\[submodule\b[^\]]*\]\s*$/m).slice(1);
  return blocks.flatMap((block) => {
    const path = /^\s*path\s*=\s*(.+)$/m.exec(block)?.[1]?.trim();
    const url = /^\s*url\s*=\s*(.+)$/m.exec(block)?.[1]?.trim();
    return path && url ? [{ path, url }] : [];
  });
}

/** Git's answer, or null when git had none: no repository, no remote,
 *  no network. */
const git = (cwd: string, args: readonly string[]): Promise<string | null> =>
  run('git', [...args], { cwd }).then(
    ({ stdout }) => stdout.trim(),
    () => null,
  );

const describe = async (root: string, pin: Pin): Promise<Sibling> => {
  const cwd = path.join(root, pin.path);
  const pinned = (await git(root, ['rev-parse', `HEAD:${pin.path}`])) ?? 'unpinned';
  const remoteLine = await git(cwd, ['ls-remote', pin.url, 'HEAD']);
  const remote = remoteLine?.split(/\s+/)[0];
  return { ...pin, pinned, remote, drifted: remote !== undefined && remote !== pinned };
};

/** Siblings as `.gitmodules` at `root` declares them. No file, no
 *  siblings: the report is honest about an empty workspace. */
export const gitSiblings = (root: string): Layer.Layer<SiblingsService> =>
  Layer.succeed(Siblings, {
    list: () =>
      Effect.promise(async () => {
        const text = await readFile(path.join(root, '.gitmodules'), 'utf8').catch(() => '');
        return Promise.all(parseGitmodules(text).map((pin) => describe(root, pin)));
      }),
  });
