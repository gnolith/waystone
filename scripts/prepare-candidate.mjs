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
        'a57799a792a075a5e359567240a7241a48df4155fae3a9e73b092ccf9035955b',
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
        commit: 'abbdb1c3f07d8466883c9f00ad3927c81ca78769',
        tree: 'cff0dc55ebd2793ef5b64cc08ecdaad1a52ef6b1',
        archiveSha256:
          '6d466fa1f91ba93efe070dada9ad8b1e14bde6b4d9cc7e94bdefcb3f25fe95d4',
        integrity:
          'sha512-l2QBIN0hFD/XR+mjLucIvcuQSZg/ROED26wB8jTXuQQ0dGCiA+14W/2eRX3CqTxL3QaaqQneEHHIVaI6uTLEHg==',
        sbomSha256:
          '2703fa8ab37439b8fdac1d624bd2b57d0d325ef48b8b87847fb9f50b8b586b68',
        schemaVersion: 11,
        operationSchemaVersion: 2,
        catalogDigest:
          'a57799a792a075a5e359567240a7241a48df4155fae3a9e73b092ccf9035955b',
        assetPrefix: '/app',
      },
      files: checksums,
    },
    null,
    2,
  )}\n`,
);
console.log(output);
