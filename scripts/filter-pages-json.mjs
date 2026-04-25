import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pagesJsonPath = resolve('dist/client/pages.json');
const raw = readFileSync(pagesJsonPath, 'utf8');
const parsed = JSON.parse(raw);

if (!Array.isArray(parsed.pages)) {
  throw new Error(`Expected pages array in ${pagesJsonPath}`);
}

parsed.pages = parsed.pages.filter((page) => page?.sitemap?.exclude !== true);

writeFileSync(pagesJsonPath, `${JSON.stringify(parsed, null, 2)}\n`);
