import { spawnSync } from 'node:child_process';
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
const canary = path.resolve('examples/codex-site-canary');
run(['install', '--ignore-scripts', '--save-exact', archive], canary);
process.stdout.write(run(['test'], canary));
console.log(`Fresh consumer verified from ${path.basename(archive)}.`);
