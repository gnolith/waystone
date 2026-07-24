import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
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
const archive = readFileSync(identity.archive);
const actualNames = operationCatalog.map(({ name }) => name);
const failures = [];

if (
  installed.name !== identity.package ||
  installed.version !== identity.version
)
  failures.push('Installed Workshop coordinate does not match the binding.');
if (statSync(identity.archive).size !== identity.archiveBytes)
  failures.push('Workshop archive byte length does not match the binding.');
if (
  createHash('sha256').update(archive).digest('hex') !== identity.archiveSha256
)
  failures.push('Workshop archive SHA-256 does not match the binding.');
if (CATALOG_DIGEST !== identity.catalogDigest)
  failures.push('Workshop public catalog digest does not match the binding.');
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

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Exact ${identity.package}@${identity.version} archive, schema, and ${actualNames.length}-operation catalog verified (${CATALOG_DIGEST}).`,
);
