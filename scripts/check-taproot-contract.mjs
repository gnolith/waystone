import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const TAPROOT = '@gnolith/taproot@0.4.0';
const WORKSHOP = '@gnolith/workshop@0.4.1';
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run protocol conformance through npm.');

function run(args, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}
function archive(output, root) {
  return path.join(root, path.basename(JSON.parse(output)[0].filename));
}

const root = mkdtempSync(path.join(tmpdir(), 'waystone-protocol-'));
const consumer = path.join(root, 'consumer');
try {
  run(['run', 'build']);
  const waystone = archive(
    run(['pack', '--ignore-scripts', '--json', '--pack-destination', root]),
    root,
  );
  mkdirSync(path.join(consumer, 'src'), { recursive: true });
  writeFileSync(
    path.join(consumer, 'package.json'),
    JSON.stringify(
      { name: 'waystone-protocol-conformance', private: true, type: 'module' },
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
          skipLibCheck: true,
          noEmit: true,
          types: [],
        },
        include: ['src/**/*.ts'],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(consumer, 'src', 'contract.ts'),
    `
import type {
  SearchRequest, SearchPage, ResourceV1, CreateResourceInputV1,
  AnnotationV1, CreateAnnotationInputV1, Statement, EntityCommand,
} from '@gnolith/taproot';
import type { Prompt, CreatePromptInput, UpdatePromptInput, PromptRevision } from '@gnolith/workshop/protocol';
import type {
  SearchRequest as WSearchRequest, SearchPage as WSearchPage,
  TaprootResource, TaprootCreateResourceInput, TaprootAnnotation,
  TaprootCreateAnnotationInput, WorkshopPrompt, WorkshopCreatePromptInput,
  WorkshopUpdatePromptInput, WorkshopPromptRevision, TaprootStatement, TaprootEntityCommand,
} from '@gnolith/waystone';
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
type _SearchRequest = Assert<Equal<SearchRequest, WSearchRequest>>;
type _SearchPage = Assert<Equal<SearchPage, WSearchPage>>;
type _Resource = Assert<Equal<ResourceV1, TaprootResource>>;
type _CreateResource = Assert<Equal<CreateResourceInputV1, TaprootCreateResourceInput>>;
type _Annotation = Assert<Equal<AnnotationV1, TaprootAnnotation>>;
type _CreateAnnotation = Assert<Equal<CreateAnnotationInputV1, TaprootCreateAnnotationInput>>;
type _Prompt = Assert<Equal<Prompt, WorkshopPrompt>>;
type _CreatePrompt = Assert<Equal<CreatePromptInput, WorkshopCreatePromptInput>>;
type _UpdatePrompt = Assert<Equal<UpdatePromptInput, WorkshopUpdatePromptInput>>;
type _PromptRevision = Assert<Equal<PromptRevision, WorkshopPromptRevision>>;
type _Statement = Assert<Equal<Statement, TaprootStatement>>;
type _EntityCommand = Assert<Equal<EntityCommand, TaprootEntityCommand>>;
`,
  );
  run(
    [
      'install',
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--save-exact',
      waystone,
      TAPROOT,
      WORKSHOP,
      '@types/react@19.2.14',
      'react@19.2.6',
      'react-dom@19.2.6',
      'typescript@5.9.3',
    ],
    consumer,
  );
  run(['exec', '--', 'tsc', '-p', 'tsconfig.json'], consumer);
  console.log(
    `Waystone declarations exactly match ${TAPROOT} and ${WORKSHOP} across search, content, prompts, statements, and commands.`,
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
