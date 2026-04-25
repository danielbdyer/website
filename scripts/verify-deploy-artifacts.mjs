import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distClient = resolve('dist/client');
const foyerHtml = resolve(distClient, 'index.html');

if (!existsSync(foyerHtml)) {
  console.error('Missing dist/client/index.html. Deploy the dist/client output only.');
  process.exit(1);
}

const html = readFileSync(foyerHtml, 'utf8');

if (!html.includes('/assets/index-')) {
  console.error('Missing hashed CSS asset link in dist/client/index.html.');
  process.exit(1);
}

if (
  !html.includes('/studio') ||
  !html.includes('/garden') ||
  !html.includes('/study') ||
  !html.includes('/salon')
) {
  console.error('Foyer prerender is missing one or more room links.');
  process.exit(1);
}

console.log('Deploy artifact check passed: dist/client contains prerendered HTML + hashed assets.');
