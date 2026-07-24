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
        commit: '10ce0e1ae441094b28e61ad2772e10e1b391a464',
        tree: '9e4cd3270b38c89acdebac6b592862692e3c75d2',
        archiveBytes: 273978,
        archiveSha256:
          '6479db87d6c2529b4a5c9e5063cc705f8f2aa3057ae4c7d5a0668e36e48163e4',
        integrity:
          'sha512-Z0EKHsceaZsDCwcwjVZm75uUeosRj7V1WPTPVejqToRNjepITYbGWYb5KKozVDTKmOTJS70NkxM6cZZIFGQLsQ==',
        sbomSha256:
          '27aef7d6ae4a0b82a044bfde2d055d32380928dedc08428c9ffeed77574b8658',
        inventorySha256:
          'b586c25337a5b5035ef4eaab80efe043ac728c970f1109327d17ad8be1e40d90',
        checksumManifestSha256:
          'bd4650b53f23e5ea468a84acedc7d0ce7a92c25eb7a46f2af4a05c96be94d29f',
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
