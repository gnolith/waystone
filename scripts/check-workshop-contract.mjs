import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CATALOG_DIGEST,
  OPERATION_SCHEMA_VERSION,
  operationCatalog,
} from '@gnolith/workshop/protocol';

const identity = JSON.parse(
  readFileSync('test/fixtures/workshop-protocol-identity.json', 'utf8'),
);
const expectedOperations = JSON.parse(
  readFileSync('test/fixtures/workshop-operation-catalog.json', 'utf8'),
);
const installed = JSON.parse(
  readFileSync('node_modules/@gnolith/workshop/package.json', 'utf8'),
);
const packageIndex = readFileSync(
  'node_modules/@gnolith/workshop/dist/index.js',
  'utf8',
);
const serverIndex = readFileSync(
  'node_modules/@gnolith/workshop/dist/server.js',
  'utf8',
);
const { WORKSHOP_RECOMMENDED_ASSET_PREFIX, verifyWaystoneAssetMount } =
  await import(
    pathToFileURL(
      path.resolve('node_modules/@gnolith/workshop/dist/server/assets.js'),
    ).href
  );
const archive = readFileSync(identity.archive);
const actualNames = operationCatalog.map(({ name }) => name);
const failures = [];
const assetManifest = JSON.parse(
  readFileSync('dist/waystone-assets.json', 'utf8'),
);

if (
  installed.name !== identity.package ||
  installed.version !== identity.version
)
  failures.push('Installed Workshop coordinate does not match the binding.');
if (
  installed.exports?.['./client']?.import !== './dist/client.js' ||
  installed.exports?.['./protocol']?.import !== './dist/protocol.js' ||
  installed.exports?.['./server']?.import !== './dist/server.js' ||
  !serverIndex.includes("export * from './server/assets.js'")
)
  failures.push(
    'Workshop public client, protocol, or asset export is missing.',
  );
if (statSync(identity.archive).size !== identity.archiveBytes)
  failures.push('Workshop archive byte length does not match the binding.');
if (
  createHash('sha256').update(archive).digest('hex') !== identity.archiveSha256
)
  failures.push('Workshop archive SHA-256 does not match the binding.');
if (CATALOG_DIGEST !== identity.catalogDigest)
  failures.push('Workshop public catalog digest does not match the binding.');
if (!packageIndex.includes(`schemaVersion: ${identity.schemaVersion}`))
  failures.push('Workshop package schema version does not match the binding.');
if (OPERATION_SCHEMA_VERSION !== identity.operationSchemaVersion)
  failures.push(
    'Workshop operation schema version does not match the binding.',
  );
if (actualNames.length !== identity.operationCount)
  failures.push('Workshop operation count does not match the binding.');
if (JSON.stringify(actualNames) !== JSON.stringify(expectedOperations))
  failures.push(
    'Workshop public operation catalog does not match the reviewed inventory.',
  );
if (WORKSHOP_RECOMMENDED_ASSET_PREFIX !== identity.assetPrefix)
  failures.push('Workshop canonical asset prefix does not match the binding.');

try {
  const assets = await verifyWaystoneAssetMount({
    prefix: identity.assetPrefix,
    manifest: assetManifest,
    source: {
      async read(assetPath) {
        const file = path.join('dist', assetPath);
        try {
          return {
            bytes: readFileSync(file),
            symlink: lstatSync(file).isSymbolicLink(),
          };
        } catch {
          return null;
        }
      },
    },
  });
  const entrypoint = await assets.serve(
    `${identity.assetPrefix}/${assetManifest.entrypoint}`,
  );
  if (
    assets.prefix !== identity.assetPrefix ||
    !entrypoint ||
    entrypoint.status !== 200
  )
    failures.push('Workshop did not serve the verified Waystone entrypoint.');
} catch (error) {
  failures.push(
    `Workshop rejected the immutable Waystone asset contract: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Exact ${identity.package}@${identity.version} archive, schema, ${actualNames.length}-operation catalog, and ${identity.assetPrefix} asset mount verified (${CATALOG_DIGEST}).`,
);
