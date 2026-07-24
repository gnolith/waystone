import { build } from 'esbuild';

const budgets = {
  'server-safe views': [
    "export { WaystoneShell, EntityPage, UnifiedSearchResults } from './dist/index.js';",
    55_000,
  ],
  'entity operations': [
    "export { EntitySearch, EntityEditor, SparqlEditor } from './dist/client.js';",
    45_000,
  ],
  'content operations': [
    "export { ResourceBrowser, AnnotationBrowser, PromptBrowser, MemoryBrowser } from './dist/client.js';",
    65_000,
  ],
  'task operations': [
    "export { TaskBrowser, TaskWorkspace } from './dist/client.js';",
    45_000,
  ],
};
let failed = false;
for (const [label, [source, limit]] of Object.entries(budgets)) {
  const result = await build({
    stdin: { contents: source, resolveDir: process.cwd() },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
  });
  const size = result.outputFiles.reduce(
    (sum, file) => sum + file.contents.byteLength,
    0,
  );
  console.log(
    `${size <= limit ? 'PASS' : 'FAIL'} ${label}: ${size} / ${limit} bytes`,
  );
  failed ||= size > limit;
}
if (failed) process.exit(1);
