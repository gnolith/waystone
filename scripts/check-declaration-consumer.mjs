import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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

const root = mkdtempSync(path.join(tmpdir(), 'waystone-declarations-'));
const consumer = path.join(root, 'consumer');
try {
  const packed = JSON.parse(
    run(['pack', '--ignore-scripts', '--json', '--pack-destination', root]),
  );
  const archive = path.join(root, 'candidate.tgz');
  renameSync(path.join(root, path.basename(packed[0].filename)), archive);
  mkdirSync(path.join(consumer, 'src'), { recursive: true });
  writeFileSync(
    path.join(consumer, 'package.json'),
    JSON.stringify(
      {
        name: 'waystone-declaration-canary',
        private: true,
        type: 'module',
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(consumer, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          exactOptionalPropertyTypes: true,
          noEmit: true,
          skipLibCheck: false,
          jsx: 'react-jsx',
          lib: ['ES2022', 'DOM'],
        },
        include: ['src'],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(consumer, 'src', 'consumer.tsx'),
    `
import { WaystoneShell, type WorkshopClient, type SearchKind } from '@gnolith/waystone';
import { UnifiedSearchScreen, TaskBrowser } from '@gnolith/waystone/client';
import { createWaystoneRegistry } from '@gnolith/waystone/plugin';
import { WaystoneApplicationShell } from '@gnolith/waystone/site';
import { waystoneAssetManifest } from '@gnolith/waystone/assets';
declare const client: WorkshopClient;
const kinds: readonly SearchKind[] = ['item','resource','annotation','prompt','memory','task','statement'];
createWaystoneRegistry([{ id: 'canary', label: 'Canary', version: '1.0.0', capabilities: [] }]);
export const view = <WaystoneApplicationShell><WaystoneShell title="Canary"><UnifiedSearchScreen client={client} /><TaskBrowser client={client} /></WaystoneShell></WaystoneApplicationShell>;
void kinds; void waystoneAssetManifest;
`,
  );
  run(
    [
      'install',
      '--ignore-scripts',
      '--save-exact',
      archive,
      '@types/react@19.2.14',
      'react@19.2.6',
      'react-dom@19.2.6',
      'typescript@5.9.3',
    ],
    consumer,
  );
  run(['exec', '--', 'tsc', '-p', 'tsconfig.json'], consumer);
  const declarations = readFileSync(
    path.join(
      consumer,
      'node_modules',
      '@gnolith',
      'waystone',
      'dist',
      'model.d.ts',
    ),
    'utf8',
  );
  if (/@gnolith\/(?:taproot|diamond)|node:|cloudflare:/.test(declarations))
    throw new Error('Public declarations cross a forbidden package boundary.');
  console.log(
    'All public declaration entrypoints compile in a strict isolated consumer.',
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
