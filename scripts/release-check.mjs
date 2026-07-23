import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const expectedTag = process.argv[2];
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const identity = JSON.parse(
  readFileSync('test/fixtures/workshop-protocol-identity.json', 'utf8'),
);
const changelog = readFileSync('CHANGELOG.md', 'utf8');
const failures = [];

if (expectedTag !== `v${manifest.version}`)
  failures.push(`Expected exact candidate tag v${manifest.version}.`);
if (
  lock.version !== manifest.version ||
  lock.packages?.['']?.version !== manifest.version
)
  failures.push('Root lockfile version does not match package version.');
if (
  !new RegExp(
    `^## \\[${manifest.version.replaceAll('.', '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`,
    'm',
  ).test(changelog)
)
  failures.push('Changelog lacks the dated candidate heading.');
if (
  !identity.exactCoordinate ||
  !identity.archiveSha256 ||
  !identity.catalogDigest ||
  identity.schemaVersion.includes('candidate')
)
  failures.push(
    'Exact Workshop release coordinate, archive SHA-256, and published catalog identity are not bound.',
  );
if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim())
  failures.push('Release check requires a clean worktree.');

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Release metadata for ${expectedTag} is fully bound and clean.`);
