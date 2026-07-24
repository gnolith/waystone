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
        '7a66ccb7ed6c5ae33be526a318376b895d2ecb122d7e723fb3117baf8ad66224',
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
        commit: '1140631d7908920b2dc47d1baf3c729d25a4a409',
        tree: '4857f2d941a64a1d26af2a12383066149edbd3fe',
        archiveSha256:
          '6d297b644b38aaacabb606521a916013ba61c0c7ebb5a0c7980f304caadefa77',
        integrity:
          'sha512-kO9l/nW90hLcSxyzu04ZASoEPwHpWIwVI3fqg1jlwB7SWjaprNxTyvhi9p9cydMiTaGT8Nda3Cc6v8pq0Vdz2g==',
        sbomSha256:
          'cf86bf498124f0bf9a2a37ea1c22c4a13b0d9e299d9673bd55ff79e0959cdae4',
        schemaVersion: 11,
        operationSchemaVersion: 2,
        catalogDigest:
          '7a66ccb7ed6c5ae33be526a318376b895d2ecb122d7e723fb3117baf8ad66224',
        assetPrefix: '/app',
      },
      files: checksums,
    },
    null,
    2,
  )}\n`,
);
console.log(output);
