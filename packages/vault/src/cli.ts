import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { sliceFromVault, type VaultFile } from './index.ts';

// Cut a slice from a vault on disk and write it as JSON:
//
//   node packages/vault/src/cli.ts <vault-dir> <out.json> [space]
//
// Reads `notes/` and `inbox/` under the vault root. Runs on Node's own
// type stripping — no build step. The slice it writes is data; slices
// cut from private sources stay out of the repository (.gitignore) and
// reach the sky through VITE_SKY_SLICE (src/shared/content/slices.ts).

const READ_DIRS = ['notes', 'inbox'] as const;

function filesUnder(root: string, dir: string): readonly VaultFile[] {
  const at = path.join(root, dir);
  try {
    return readdirSync(at, { withFileTypes: true }).flatMap((entry) =>
      entry.isFile() && entry.name.endsWith('.md')
        ? [{ path: `${dir}/${entry.name}`, text: readFileSync(path.join(at, entry.name), 'utf8') }]
        : [],
    );
  } catch {
    return [];
  }
}

function main(argv: readonly string[]): number {
  const [vaultArg, outArg, spaceArg] = argv;
  if (!vaultArg || !outArg) {
    console.error('usage: node packages/vault/src/cli.ts <vault-dir> <out.json> [space]');
    return 2;
  }
  const root = path.resolve(vaultArg);
  const files = READ_DIRS.flatMap((dir) => filesUnder(root, dir));
  const slice = sliceFromVault(files, {
    space: spaceArg ?? path.basename(root),
    asOf: new Date().toISOString(),
  });
  const out = path.resolve(outArg);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(slice, null, 2)}\n`);
  console.info(
    `${slice.space}: ${slice.axes.length} axes, ${slice.nodes.length} nodes, ${slice.edges.length} edges, ${slice.pending.unresolved} pending → ${out}`,
  );
  return 0;
}

process.exitCode = main(process.argv.slice(2));
