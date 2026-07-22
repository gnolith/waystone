import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const taprootCommit = '38b97616da07ee349cf30877653acd84d1689139';
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run the Taproot contract check through npm.');

function run(command, args, cwd = process.cwd()) {
  const executable = command === 'npm' ? process.execPath : command;
  const commandArgs = command === 'npm' ? [npmCli, ...args] : args;
  const result = spawnSync(executable, commandArgs, {
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
  return result.stdout.trim();
}

function packedArchive(output, root) {
  const result = JSON.parse(output);
  return path.join(root, path.basename(result[0].filename));
}

const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'waystone-taproot-'));
const taproot = path.join(temporaryRoot, 'taproot');
const consumer = path.join(temporaryRoot, 'consumer');

try {
  run('git', [
    'clone',
    '--quiet',
    '--filter=blob:none',
    '--no-checkout',
    'https://github.com/gnolith/taproot.git',
    taproot,
  ]);
  run('git', ['checkout', '--quiet', '--detach', taprootCommit], taproot);
  const checkedOut = run('git', ['rev-parse', 'HEAD'], taproot);
  if (checkedOut !== taprootCommit) {
    throw new Error(`Expected Taproot ${taprootCommit}, found ${checkedOut}.`);
  }
  run('npm', ['ci', '--ignore-scripts'], taproot);
  run('npm', ['run', 'build'], taproot);
  const taprootArchive = packedArchive(
    run(
      'npm',
      [
        'pack',
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        temporaryRoot,
      ],
      taproot,
    ),
    temporaryRoot,
  );
  const waystoneArchive = packedArchive(
    run('npm', [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      temporaryRoot,
    ]),
    temporaryRoot,
  );

  mkdirSync(path.join(consumer, 'src'), { recursive: true });
  writeFileSync(
    path.join(consumer, 'package.json'),
    `${JSON.stringify(
      {
        name: 'waystone-taproot-contract',
        version: '0.0.0',
        private: true,
        type: 'module',
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    path.join(consumer, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: [],
        },
        include: ['src/**/*.ts'],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    path.join(consumer, 'src', 'contract.ts'),
    `import type { EntityCommand, Statement } from '@gnolith/taproot';\nimport type { TaprootEntityCommand, TaprootStatement } from '@gnolith/waystone';\n\ndeclare const upstreamStatement: Statement;\ndeclare const waystoneStatement: TaprootStatement;\nconst upstreamFromWaystone: Statement = waystoneStatement;\nconst waystoneFromUpstream: TaprootStatement = upstreamStatement;\n\ndeclare const upstreamCommand: EntityCommand;\ndeclare const waystoneCommand: TaprootEntityCommand;\nconst upstreamCommandFromWaystone: EntityCommand = waystoneCommand;\nconst waystoneCommandFromUpstream: TaprootEntityCommand = upstreamCommand;\nvoid upstreamFromWaystone;\nvoid waystoneFromUpstream;\nvoid upstreamCommandFromWaystone;\nvoid waystoneCommandFromUpstream;\n`,
  );
  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--save-exact',
      taprootArchive,
      waystoneArchive,
      '@types/react@19.2.14',
      'react@19.2.6',
      'react-dom@19.2.6',
      'typescript@5.9.3',
    ],
    consumer,
  );
  run('npm', ['exec', '--', 'tsc', '-p', 'tsconfig.json'], consumer);
  console.log(
    `Waystone statement and mutation contracts match exact packed Taproot commit ${taprootCommit}.`,
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
