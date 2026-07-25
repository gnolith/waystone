import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run candidate preparation through npm.');
function run(executable, args) {
  const command = executable === 'npm' ? process.execPath : executable;
  const commandArgs = executable === 'npm' ? [npmCli, ...args] : args;
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || `${executable} failed`);
  return result.stdout.trim();
}
function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const commit = run('git', ['rev-parse', 'HEAD']);
const worktree = run('git', ['status', '--porcelain']);
if (worktree)
  throw new Error('Candidate preparation requires a clean worktree.');
const output = path.resolve(
  'artifacts',
  `${manifest.version}-${commit.slice(0, 12)}`,
);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const packed = JSON.parse(
  run('npm', [
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    output,
  ]),
);
const archive = path.join(output, path.basename(packed[0].filename));
const assetManifest = path.join(output, 'waystone-assets.json');
const asset = path.join(output, 'waystone.css');
const sbom = path.join(output, 'waystone.cdx.json');
const inventory = path.join(output, 'inventory.json');
copyFileSync('dist/waystone-assets.json', assetManifest);
copyFileSync('dist/assets/waystone.css', asset);
copyFileSync('dist/waystone.cdx.json', sbom);
writeFileSync(
  inventory,
  `${JSON.stringify(
    {
      package: manifest.name,
      version: manifest.version,
      commit,
      publicExports: Object.keys(manifest.exports).sort(),
      operationCatalogDigest:
        'af455b4d6ab3560bca9c0ab48e9db7bd3cbcfa166ace875578d88d182069071f',
      workshopAssetPrefix: '/app',
      removedBoundaries: [
        'authentication and token storage',
        'canonical DTO adapters',
        'host operations and snapshots',
        'path maps and route construction',
        'server and transport implementation',
      ],
    },
    null,
    2,
  )}\n`,
);
const files = [archive, assetManifest, asset, sbom, inventory];
const checksums = Object.fromEntries(
  files
    .map((file) => [path.basename(file), sha256(file)])
    .sort(([left], [right]) => left.localeCompare(right)),
);
writeFileSync(
  path.join(output, 'SHA256SUMS'),
  `${Object.entries(checksums)
    .map(([file, digest]) => `${digest}  ${file}`)
    .join('\n')}\n`,
);
writeFileSync(
  path.join(output, 'candidate.json'),
  `${JSON.stringify(
    {
      package: manifest.name,
      version: manifest.version,
      commit,
      workshop: {
        exactCoordinate: '@gnolith/workshop@0.5.0',
        commit: '66c923f9505359ee7ae92ca48beddd044d2bb036',
        tree: 'fa55f0c8bce7a77945626f177a7759e903d7f59b',
        archiveBytes: 274551,
        archiveSha256:
          '5b266e029201e0eba33d497212b9f80c4b6821731efe289189d547c626f8d44c',
        integrity:
          'sha512-4DwTKaR/cObyGvNEUmQ0a7VzRU4oA2Ma5fO4IM2on+B8LOst0bAdeSLZvYqHl7rDblfgZyOG0OFBtlM9AKcnGw==',
        sbomSha256:
          'd5b003a1d0249b593eabf54d1e0c5ac4f3b5279bc2596b1b940cb6413a3d38f4',
        inventorySha256:
          '51107a743f2410c0621247df1e1db9cf0e2d6b43e4c4b3c9a91b2c63faa388bb',
        checksumManifestSha256:
          'e0741eefd87e3326e2022265b5016a911fc179d3b8485d2241fa465d09c482c3',
        schemaVersion: 11,
        operationSchemaVersion: 2,
        catalogDigest:
          'af455b4d6ab3560bca9c0ab48e9db7bd3cbcfa166ace875578d88d182069071f',
        assetPrefix: '/app',
      },
      files: checksums,
    },
    null,
    2,
  )}\n`,
);
console.log(output);
