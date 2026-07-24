import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(',')}}`;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function assertSafeAssetPath(value) {
  if (
    !value ||
    value.includes('\\') ||
    value.includes('?') ||
    value.includes('#') ||
    value.startsWith('/') ||
    /^[a-zA-Z]:/.test(value) ||
    value.split('/').some((part) => {
      let decoded = part;
      try {
        decoded = decodeURIComponent(part);
      } catch {
        return true;
      }
      return (
        !part ||
        part === '.' ||
        part === '..' ||
        decoded === '.' ||
        decoded === '..'
      );
    })
  )
    throw new Error(`Unsafe asset path: ${value}`);
}

const dist = path.resolve('dist');
const assetDirectory = path.join(dist, 'assets');
mkdirSync(assetDirectory, { recursive: true });
const entrypoint = 'assets/waystone.css';
assertSafeAssetPath(entrypoint);
const source = path.join(dist, 'styles.css');
const destination = path.join(dist, ...entrypoint.split('/'));
copyFileSync(source, destination);
const bytes = readFileSync(destination);
const unsigned = {
  format: 'waystone-assets-v1',
  files: [
    {
      path: entrypoint,
      sha256: sha256(bytes),
      bytes: bytes.byteLength,
      mediaType: 'text/css',
      immutable: true,
    },
  ],
  entrypoint,
};
unsigned.files.sort((left, right) => left.path.localeCompare(right.path));
const manifest = {
  ...unsigned,
  manifestSha256: sha256(Buffer.from(canonical(unsigned), 'utf8')),
};
writeFileSync(
  path.join(dist, 'waystone-assets.json'),
  `${canonical(manifest)}\n`,
  'utf8',
);
writeFileSync(
  path.join(dist, 'asset-manifest.js'),
  `const manifest = ${canonical(manifest)};\nfor (const file of manifest.files) Object.freeze(file);\nObject.freeze(manifest.files);\nexport const waystoneAssetManifest = Object.freeze(manifest);\nexport default waystoneAssetManifest;\n`,
  'utf8',
);
writeFileSync(
  path.join(dist, 'asset-manifest.d.ts'),
  `import type { WaystoneAssetManifest } from './model.js';\nexport declare const waystoneAssetManifest: WaystoneAssetManifest;\nexport default waystoneAssetManifest;\n`,
  'utf8',
);
