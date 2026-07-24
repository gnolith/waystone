import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const errors = [];
const entryFiles = [];
const forbiddenSource =
  /(?:\bfetch\s*\(|\/api\/|cloudflare:|@gnolith\/(?:taproot|diamond)|\bMCP\b|HostOperation|localStorage|sessionStorage)/;

if (manifest.version !== '0.3.0')
  errors.push('Architecture reset must be version 0.3.0.');
if (manifest.dependencies && Object.keys(manifest.dependencies).length)
  errors.push('Waystone must have no runtime dependencies.');
if (manifest.peerDependencies?.['@gnolith/workshop'] !== '0.5.0')
  errors.push('Workshop peer must bind the exact reset protocol release.');

for (const [name, target] of Object.entries(manifest.exports)) {
  for (const value of typeof target === 'string'
    ? [target]
    : Object.values(target)) {
    const file = value.replace(/^\.\//, '');
    if (!existsSync(file))
      errors.push(`Export ${name} points to missing ${file}.`);
    if (file.endsWith('.js')) entryFiles.push(file);
  }
}

const importPattern = /(?:from\s*|import\s*)["']([^"']+)["']/g;
function graph(entry, seen = new Set()) {
  const file = path.resolve(entry);
  if (seen.has(file) || !existsSync(file)) return seen;
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  if (forbiddenSource.test(source))
    errors.push(
      `Forbidden browser/package boundary in ${path.relative('.', file)}.`,
    );
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier) continue;
    if (
      specifier.startsWith('node:') ||
      specifier.startsWith('cloudflare:') ||
      builtinModules.includes(specifier)
    )
      errors.push(
        `Forbidden runtime import ${specifier} in ${path.relative('.', file)}.`,
      );
    if (specifier.startsWith('.'))
      graph(path.resolve(path.dirname(file), specifier), seen);
  }
  return seen;
}
for (const entry of entryFiles) graph(entry);
for (const file of graph('dist/index.js')) {
  if (/^["']use client["'];/m.test(readFileSync(file, 'utf8')))
    errors.push(
      `Server-safe root reaches client module ${path.relative('.', file)}.`,
    );
}
for (const file of graph('dist/fixtures.js')) {
  if (path.basename(file).includes('workshop-client'))
    errors.push('Production fixtures must not contain a Workshop client.');
}

const assets = JSON.parse(readFileSync('dist/waystone-assets.json', 'utf8'));
if (assets.format !== 'waystone-assets-v1' || !assets.manifestSha256)
  errors.push('Immutable asset manifest is invalid.');
if (!existsSync('dist/waystone.cdx.json'))
  errors.push('CycloneDX SBOM is missing.');

const packed = spawnSync(
  process.execPath,
  [process.env.npm_execpath, 'pack', '--dry-run', '--json', '--ignore-scripts'],
  { encoding: 'utf8' },
);
if (packed.status !== 0)
  errors.push(`npm pack dry run failed: ${packed.stderr}`);
else {
  const files =
    JSON.parse(packed.stdout)[0]?.files?.map((item) => item.path) ?? [];
  for (const required of [
    'dist/waystone-assets.json',
    'dist/assets/waystone.css',
    'dist/waystone.cdx.json',
    'docs/migration-0.3.md',
    'docs/monorepo-handoff.md',
  ])
    if (!files.includes(required))
      errors.push(`Tarball is missing ${required}.`);
  for (const file of files) {
    if (
      !file.startsWith('dist/') &&
      !file.startsWith('docs/') &&
      ![
        'package.json',
        'README.md',
        'LICENSE',
        'SECURITY.md',
        'CHANGELOG.md',
      ].includes(file)
    )
      errors.push(`Unexpected tarball file ${file}.`);
  }
}
if (readdirSync('dist').includes('node_modules'))
  errors.push('dist must not contain node_modules.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  'Exports, runtime graphs, assets, SBOM, and tarball boundaries verified.',
);
