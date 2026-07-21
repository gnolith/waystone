import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run the consumer check through npm.');
function run(args, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) process.stderr.write(`${result.error.message}\n`);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const packed = JSON.parse(run(['pack', '--ignore-scripts', '--json']));
const archive = path.resolve(packed[0].filename);
const sourceFixture = path.resolve('examples/codex-site-canary');
const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'waystone-consumer-'));
const consumer = path.join(temporaryRoot, 'isolated-consumer');

try {
  cpSync(sourceFixture, consumer, {
    recursive: true,
    filter(source) {
      const name = path.basename(source);
      return name !== 'node_modules' && name !== '.vinext' && name !== 'vendor';
    },
  });
  run(['install', '--ignore-scripts', '--save-exact', archive], consumer);
  process.stdout.write(run(['test'], consumer));
  console.log(
    `Exact Waystone archive verified in an isolated consumer: ${path.basename(archive)}.`,
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
  rmSync(archive, { force: true });
}
