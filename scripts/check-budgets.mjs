import { build } from 'esbuild';

const budgets = {
  'base server-safe import': {
    source:
      "export { WaystoneShell, EntityPage, StatementGroups } from './dist/index.js';",
    limit: 45_000,
  },
  'base client shell': {
    source:
      "export { WaystoneErrorBoundary, EntitySearch } from './dist/client.js';",
    limit: 30_000,
  },
  'SPARQL editor': {
    source: "export { SparqlEditor } from './dist/client.js';",
    limit: 25_000,
  },
  'entity editor': {
    source:
      "export { EntityEditor, StatementEditor, SitelinkEditor, EntityLifecycleControls } from './dist/client.js';",
    limit: 35_000,
  },
};

let failed = false;
for (const [label, budget] of Object.entries(budgets)) {
  const result = await build({
    stdin: {
      contents: budget.source,
      resolveDir: process.cwd(),
      sourcefile: `${label}.js`,
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
  });
  const size = result.outputFiles.reduce(
    (total, file) => total + file.contents.byteLength,
    0,
  );
  const status = size > budget.limit ? 'FAIL' : 'PASS';
  console.log(
    `${status} ${label}: ${size} / ${budget.limit} bytes (minified ESM, React external)`,
  );
  if (size > budget.limit) failed = true;
}
if (failed) process.exit(1);
