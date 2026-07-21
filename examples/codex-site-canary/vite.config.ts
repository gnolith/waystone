import vinext from 'vinext';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import hostingConfig from './.openai/hosting.json';
import { sites } from './build/sites-vite-plugin';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';
const PROCESS_BROWSER = fileURLToPath(
  new URL('./node_modules/process/browser.js', import.meta.url),
);
const STRING_DECODER_BROWSER = fileURLToPath(
  new URL(
    './node_modules/string_decoder/lib/string_decoder.js',
    import.meta.url,
  ),
);
const EVENTS_BROWSER = fileURLToPath(
  new URL('./node_modules/events/events.js', import.meta.url),
);
const BUFFER_BROWSER = fileURLToPath(
  new URL('./node_modules/buffer/index.js', import.meta.url),
);
const workerAliases = [
  { find: 'process/', replacement: PROCESS_BROWSER },
  { find: 'string_decoder/', replacement: STRING_DECODER_BROWSER },
  { find: /^node:events$/u, replacement: EVENTS_BROWSER },
  { find: /^events$/u, replacement: EVENTS_BROWSER },
  { find: /^node:buffer$/u, replacement: BUFFER_BROWSER },
  { find: /^buffer$/u, replacement: BUFFER_BROWSER },
];

const { d1, r2 } = hostingConfig;

const comunicaWorkerCompatibility = {
  name: 'comunica-worker-compatibility',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.includes('/@comunica/') && !id.includes('\\@comunica\\')) return;
    const transformed = code
      .replaceAll("require('process/')", 'globalThis.process')
      .replaceAll('require("process/")', 'globalThis.process');
    return transformed === code ? undefined : { code: transformed, map: null };
  },
};

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  const localBindingConfig = {
    main: './worker/index.ts',
    // Current vinext development middleware uses AsyncLocalStorage. This flag
    // is local-preview-only; the production build and deployment use none.
    compatibility_flags: command === 'serve' ? ['nodejs_compat'] : [],
    d1_databases: d1
      ? [
          {
            binding: d1,
            database_name: 'site-creator-d1',
            database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
          },
        ]
      : [],
    r2_buckets: r2 ? [{ binding: r2, bucket_name: 'site-creator-r2' }] : [],
  };

  return {
    resolve: {
      alias: workerAliases,
    },
    ssr: {
      noExternal: [/^@comunica\//, 'process'],
    },
    environments: {
      rsc: {
        resolve: {
          alias: workerAliases,
          mainFields: ['browser', 'module', 'jsnext:main', 'jsnext', 'main'],
          conditions: ['browser', 'module', 'import', 'default'],
          noExternal: [/^@comunica\//, 'process'],
        },
      },
      ssr: {
        resolve: {
          alias: workerAliases,
          mainFields: ['browser', 'module', 'jsnext:main', 'jsnext', 'main'],
          conditions: ['browser', 'module', 'import', 'default'],
          noExternal: [/^@comunica\//, 'process'],
        },
      },
    },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      comunicaWorkerCompatibility,
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: localBindingConfig,
      }),
    ],
  };
});
