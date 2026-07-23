import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('examples/browser-canary');
const manifest = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8'),
);
const errors = [];
const dependencies = {
  ...manifest.dependencies,
  ...manifest.devDependencies,
};

for (const name of Object.keys(dependencies)) {
  if (name.startsWith('@gnolith/') && name !== '@gnolith/waystone')
    errors.push(`Browser canary must not install sibling package ${name}.`);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.name === 'node_modules') return [];
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const forbidden =
  /(?:cloudflare|codex.?sites?|mcp|taproot|diamond|next\/server|app\/api|authorization\s*:|localStorage|sessionStorage)/i;
for (const file of walk(root)) {
  if (/\.(?:ts|tsx|js|mjs|json|md)$/.test(file)) {
    const match = readFileSync(file, 'utf8').match(forbidden);
    if (match)
      errors.push(
        `Forbidden consumer boundary term "${match[0]}" in ${path.relative('.', file)}.`,
      );
  }
}

for (const relative of ['app', 'worker', '.openai', 'wrangler.toml']) {
  if (existsSync(path.join(root, relative)))
    errors.push(`Browser canary must not contain ${relative}.`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  'Browser canary is isolated from servers, hosting, auth, and sibling packages.',
);
