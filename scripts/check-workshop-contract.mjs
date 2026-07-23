import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const expectedOperations = JSON.parse(
  readFileSync('test/fixtures/workshop-operation-catalog.json', 'utf8'),
);
const canonical = JSON.stringify([...expectedOperations].sort());
const digest = createHash('sha256').update(canonical).digest('hex');
const identity = JSON.parse(
  readFileSync('test/fixtures/workshop-protocol-identity.json', 'utf8'),
);
if (identity.catalogDigest !== digest)
  throw new Error(
    `Fixture catalog digest mismatch: expected ${identity.catalogDigest}, computed ${digest}.`,
  );
if (!identity.schemaVersion.startsWith('architecture-reset-candidate-'))
  throw new Error(
    'Fixture schema version is not an architecture-reset candidate.',
  );
const source = readdirSync('src')
  .filter((file) => /\.(?:ts|tsx)$/.test(file))
  .map((file) => readFileSync(`src/${file}`, 'utf8'))
  .join('\n');
const missing = expectedOperations.filter(
  (operation) =>
    !source.includes(`'${operation}'`) && !source.includes(`"${operation}"`),
);
if (missing.length)
  throw new Error(
    `UI does not reference expected operations: ${missing.join(', ')}`,
  );
console.log(
  `Test-only Workshop structural fixture verified: ${identity.schemaVersion}, ${identity.catalogDigest}. Exact Workshop candidate binding remains a handoff requirement.`,
);
