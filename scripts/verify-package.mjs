import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const errors = [];
const changelog = readFileSync('CHANGELOG.md', 'utf8');
if (manifest.private) errors.push('Package must not be private.');
if (manifest.publishConfig?.access !== 'public')
  errors.push('Scoped package must publish with public access.');
if (manifest.publishConfig?.provenance !== true)
  errors.push('npm provenance must be enabled.');
if (!changelog.includes(`## [${manifest.version}]`))
  errors.push(`CHANGELOG.md is missing version ${manifest.version}.`);
if (manifest.dependencies?.react || manifest.dependencies?.['react-dom'])
  errors.push('React must remain a peer, not a runtime dependency.');
const entryFiles = [];
for (const [name, target] of Object.entries(manifest.exports)) {
  const values = typeof target === 'string' ? [target] : Object.values(target);
  for (const value of values) {
    const file = value.replace(/^\.\//, '');
    if (!existsSync(file))
      errors.push(`Export ${name} points to missing ${file}`);
    if (file.endsWith('.js')) entryFiles.push(file);
  }
}
const importPattern = /(?:from\s*|import\s*)["']([^"']+)["']/g;
function graph(entry, seen = new Set()) {
  const file = path.resolve(entry);
  if (seen.has(file) || !existsSync(file)) return seen;
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier) continue;
    if (
      specifier.startsWith('node:') ||
      specifier.startsWith('cloudflare:') ||
      builtinModules.includes(specifier)
    )
      errors.push(
        `Forbidden runtime import ${specifier} in ${path.relative('.', file)}`,
      );
    else if (specifier.startsWith('.'))
      graph(path.resolve(path.dirname(file), specifier), seen);
  }
  return seen;
}
for (const entry of entryFiles) graph(entry);
for (const file of graph('dist/index.js')) {
  const source = readFileSync(file, 'utf8');
  if (/^["']use client["'];/m.test(source))
    errors.push(
      `Server-safe root reaches client module ${path.relative('.', file)}`,
    );
}
for (const entry of entryFiles) {
  if (!existsSync(entry.replace(/\.js$/, '.d.ts')))
    errors.push(`Missing declaration for ${entry}`);
}
const packed = spawnSync(
  process.execPath,
  [process.env.npm_execpath, 'pack', '--dry-run', '--json', '--ignore-scripts'],
  { encoding: 'utf8' },
);
if (packed.status !== 0)
  errors.push(`npm pack dry run failed: ${packed.stderr}`);
else {
  const output = JSON.parse(packed.stdout);
  const files = output[0]?.files?.map((item) => item.path) ?? [];
  for (const file of files)
    if (!(
      file.startsWith('dist/') ||
      file.startsWith('docs/') ||
      [
        'package.json',
        'README.md',
        'LICENSE',
        'SECURITY.md',
        'CHANGELOG.md',
      ].includes(file)
    ))
      errors.push(`Unexpected tarball file ${file}`);
}
if (
  readdirSync('dist').some(
    (name) => name === 'node_modules' || name === 'react.js',
  )
)
  errors.push('React or node_modules was bundled into dist.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  'Package exports, declarations, runtime graphs, externals, and tarball contents verified.',
);
