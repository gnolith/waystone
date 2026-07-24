import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check through npm.');

function run(args, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'waystone-browser-'));
const consumer = path.join(temporaryRoot, 'consumer');
const workshopArchive = path.resolve(
  'test/fixtures/gnolith-workshop-0.5.0.tgz',
);
try {
  const packed = JSON.parse(
    run([
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      temporaryRoot,
    ]),
  );
  const archive = path.join(temporaryRoot, 'waystone-candidate.tgz');
  renameSync(
    path.join(temporaryRoot, path.basename(packed[0].filename)),
    archive,
  );
  cpSync(path.resolve('examples/browser-canary'), consumer, {
    recursive: true,
    filter(source) {
      return path.basename(source) !== 'node_modules';
    },
  });
  run(
    ['install', '--ignore-scripts', '--save-exact', archive, workshopArchive],
    consumer,
  );
  process.stdout.write(run(['test'], consumer));
  console.log('Exact packed archive passed the isolated browser consumer.');
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
