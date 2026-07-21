import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const fixtureRoot = path.resolve('examples/codex-site-canary');
const manifest = JSON.parse(
  readFileSync(path.join(fixtureRoot, 'package.json'), 'utf8'),
);
const lock = JSON.parse(
  readFileSync(path.join(fixtureRoot, 'package-lock.json'), 'utf8'),
);
const errors = [];

const dependencyNames = Object.keys({
  ...manifest.dependencies,
  ...manifest.devDependencies,
});
for (const name of dependencyNames) {
  if (name.startsWith('@gnolith/') && name !== '@gnolith/waystone') {
    errors.push(
      `Isolated consumer must not depend on sibling package ${name}.`,
    );
  }
}

for (const name of [
  '@gnolith/diamond',
  '@gnolith/taproot',
  '@gnolith/workshop',
]) {
  if (lock.packages?.[`node_modules/${name}`]) {
    errors.push(`Isolated consumer lockfile installs sibling package ${name}.`);
  }
}

for (const relative of [
  '.openai/hosting.json',
  'build/sites-vite-plugin.ts',
  'cloudflare-env.d.ts',
  'drizzle.config.ts',
  'worker/index.ts',
  'app/api/_taproot.ts',
  'app/api/_sparql.ts',
]) {
  if (existsSync(path.join(fixtureRoot, relative))) {
    errors.push(`Site-owned fixture file must not be present: ${relative}.`);
  }
}

const consumerCheck = readFileSync('scripts/check-consumer.mjs', 'utf8');
if (!consumerCheck.includes("name !== 'vendor'")) {
  errors.push(
    'The isolated consumer copy must exclude the legacy vendor directory.',
  );
}

const trackedVendorArchive = spawnSync(
  'git',
  [
    'ls-files',
    '--error-unmatch',
    'examples/codex-site-canary/vendor/gnolith-workshop-0.1.0.tgz',
  ],
  { stdio: 'ignore' },
);
if (trackedVendorArchive.status === 0) {
  errors.push('The legacy Workshop vendor archive must not be tracked.');
}
if (trackedVendorArchive.error) {
  errors.push(
    `Could not verify tracked vendor files: ${trackedVendorArchive.error.message}`,
  );
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  'Isolated consumer has no sibling-package assembly or Site-owned hosting files.',
);
