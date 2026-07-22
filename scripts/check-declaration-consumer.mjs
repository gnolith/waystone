import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run the declaration check through npm.');
const candidateVersion = JSON.parse(
  readFileSync('package.json', 'utf8'),
).version;

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

function declarationFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return declarationFiles(entryPath);
    return /\.d\.ts(?:\.map)?$/.test(entry.name) ? [entryPath] : [];
  });
}

const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'waystone-types-'));
const consumer = path.join(temporaryRoot, 'strict-consumer');

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
  const packedArchive = path.join(
    temporaryRoot,
    path.basename(packed[0].filename),
  );
  const archive = path.join(temporaryRoot, 'waystone-types-candidate.tgz');
  renameSync(packedArchive, archive);

  mkdirSync(path.join(consumer, 'src'), { recursive: true });
  writeFileSync(
    path.join(consumer, 'package.json'),
    `${JSON.stringify(
      {
        name: 'waystone-strict-declaration-consumer',
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
          skipLibCheck: false,
          noEmit: true,
          jsx: 'react-jsx',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          types: [],
        },
        include: ['src/**/*.ts', 'src/**/*.tsx'],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    path.join(consumer, 'src', 'consumer.ts'),
    `import { fromTaprootEntity, type TaprootWikibaseEntity, type WikibaseEntity, type UnifiedSearchResult, type ResourceRecord, type AnnotationRecord, type PromptRecord } from '@gnolith/waystone';\nimport { createWaystoneClient, hydrateSearchResult, type CreateWaystoneClientOptions } from '@gnolith/waystone/client';\n\ndeclare const canonical: TaprootWikibaseEntity;\ndeclare const result: UnifiedSearchResult;\ndeclare const resource: ResourceRecord;\ndeclare const annotation: AnnotationRecord;\ndeclare const prompt: PromptRecord;\nconst display: WikibaseEntity = fromTaprootEntity(canonical);\nconst options: CreateWaystoneClientOptions = { baseUrl: '/api' };\nconst client = createWaystoneClient(options);\nvoid hydrateSearchResult(client, result);\nvoid display;\nvoid resource;\nvoid annotation;\nvoid prompt;\n`,
  );
  writeFileSync(
    path.join(consumer, 'src', 'consumer.tsx'),
    `import { EntityPage, ResourceView, AnnotationView, PromptView, WaystoneMain, type WikibaseEntity, type ResourceRecord, type AnnotationRecord, type PromptRecord } from '@gnolith/waystone';\nimport { UnifiedSearchScreen } from '@gnolith/waystone/client';\nimport type { WaystoneClient } from '@gnolith/waystone';\n\ndeclare const entity: WikibaseEntity;\ndeclare const resource: ResourceRecord;\ndeclare const annotation: AnnotationRecord;\ndeclare const prompt: PromptRecord;\ndeclare const client: WaystoneClient;\nexport const view = (\n  <WaystoneMain>\n    <EntityPage entity={entity} />\n    <UnifiedSearchScreen client={client} />\n    <ResourceView resource={resource} />\n    <AnnotationView annotation={annotation} />\n    <PromptView prompt={prompt} />\n  </WaystoneMain>\n);\n`,
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

  const tree = JSON.parse(run(['ls', '--all', '--json'], consumer));
  const exactVersions = {
    '@gnolith/waystone': candidateVersion,
    '@types/react': '19.2.14',
    react: '19.2.6',
    'react-dom': '19.2.6',
    typescript: '5.9.3',
  };
  for (const [name, version] of Object.entries(exactVersions)) {
    if (tree.dependencies?.[name]?.version !== version) {
      throw new Error(
        `Strict consumer expected ${name}@${version}, found ${tree.dependencies?.[name]?.version ?? 'nothing'}.`,
      );
    }
  }

  run(['exec', '--', 'tsc', '-p', 'tsconfig.json'], consumer);
  const resolvedFiles = run(
    ['exec', '--', 'tsc', '-p', 'tsconfig.json', '--listFilesOnly'],
    consumer,
  );
  const forbiddenResolved = [
    /node_modules[\\/]@gnolith[\\/](?:taproot|diamond)[\\/]/i,
    /node_modules[\\/]@comunica[\\/]/i,
    /node_modules[\\/](?:rdf-parse|lru-cache)[\\/]/i,
  ];
  for (const pattern of forbiddenResolved) {
    const match = resolvedFiles.match(pattern);
    if (match) {
      throw new Error(
        `Strict consumer resolved a forbidden transitive declaration: ${match[0]}`,
      );
    }
  }
  if (
    !resolvedFiles.includes('node_modules\\@gnolith\\waystone\\dist') &&
    !resolvedFiles.includes('node_modules/@gnolith/waystone/dist')
  ) {
    throw new Error('Strict consumer did not resolve Waystone declarations.');
  }

  const installedWaystone = path.join(
    consumer,
    'node_modules',
    '@gnolith',
    'waystone',
  );
  const forbiddenSpecifier =
    /@gnolith\/(?:taproot|diamond)|@comunica\/|(?:^|["'])rdf-parse(?:[\/"']|$)|(?:^|["'])lru-cache(?:[\/"']|$)/m;
  for (const file of declarationFiles(path.join(installedWaystone, 'dist'))) {
    if (forbiddenSpecifier.test(readFileSync(file, 'utf8'))) {
      throw new Error(
        `Packed Waystone declaration contains a forbidden transitive specifier: ${path.relative(installedWaystone, file)}`,
      );
    }
  }

  console.log(
    'Exact packed Waystone declarations compile for strict TS and TSX consumers without resolving Taproot, Diamond, Comunica, rdf-parse, or lru-cache declarations.',
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
