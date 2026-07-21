import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const expectedTag = process.argv[2];
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const consumerManifest = JSON.parse(
  readFileSync('examples/codex-site-canary/package.json', 'utf8'),
);
const consumerLock = JSON.parse(
  readFileSync('examples/codex-site-canary/package-lock.json', 'utf8'),
);
const changelog = readFileSync('CHANGELOG.md', 'utf8');
const releaseWorkflow = readFileSync('.github/workflows/release.yml', 'utf8');
const failures = [];

const packCommand = 'npm pack --ignore-scripts';
const dryRunCommand =
  'npm publish "$archive" --dry-run --ignore-scripts --access public';
const publishCommand =
  'npm publish "${{ steps.package.outputs.archive }}" --ignore-scripts --access public --provenance';

const requireCondition = (condition, message) => {
  if (!condition) failures.push(message);
};

requireCondition(
  /^v\d+\.\d+\.\d+$/.test(expectedTag ?? ''),
  'Pass an exact stable release tag such as v0.1.1.',
);
requireCondition(
  expectedTag === `v${manifest.version}`,
  `Candidate tag ${expectedTag ?? '(missing)'} does not match package version v${manifest.version}.`,
);
requireCondition(
  lock.version === manifest.version &&
    lock.packages?.['']?.version === manifest.version,
  'Root package-lock version does not match package.json.',
);
requireCondition(
  consumerManifest.version === manifest.version &&
    consumerLock.version === manifest.version &&
    consumerLock.packages?.['']?.version === manifest.version,
  'Isolated-consumer version does not match package.json.',
);

const archive = `file:../../gnolith-waystone-${manifest.version}.tgz`;
requireCondition(
  consumerManifest.dependencies?.['@gnolith/waystone'] === archive &&
    consumerLock.packages?.['']?.dependencies?.['@gnolith/waystone'] ===
      archive &&
    consumerLock.packages?.['node_modules/@gnolith/waystone']?.version ===
      manifest.version &&
    consumerLock.packages?.['node_modules/@gnolith/waystone']?.resolved ===
      archive,
  'Isolated consumer does not resolve the exact candidate archive.',
);
requireCondition(
  new RegExp(
    `^## \\[${manifest.version.replaceAll('.', '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`,
    'm',
  ).test(changelog),
  `CHANGELOG.md lacks a dated ${manifest.version} release heading.`,
);
requireCondition(
  changelog.includes(
    `[Unreleased]: https://github.com/gnolith/waystone/compare/v${manifest.version}...HEAD`,
  ),
  'Unreleased changelog comparison does not start at the candidate version.',
);
requireCondition(
  /on:\s*\n\s+release:\s*\n\s+types: \[published\]/.test(releaseWorkflow) &&
    !/^\s+push:/m.test(releaseWorkflow),
  'Release workflow must have exactly the GitHub Release published trigger.',
);
requireCondition(
  releaseWorkflow.includes('id-token: write') &&
    releaseWorkflow.includes('environment: npm') &&
    releaseWorkflow.includes(packCommand) &&
    releaseWorkflow.includes(dryRunCommand) &&
    releaseWorkflow.includes(publishCommand) &&
    releaseWorkflow.indexOf(packCommand) <
      releaseWorkflow.indexOf(publishCommand) &&
    (releaseWorkflow.match(/NODE_AUTH_TOKEN:/g) ?? []).length === 1 &&
    (releaseWorkflow.match(/secrets\.NPM_BOOTSTRAP_TOKEN/g) ?? []).length ===
      1 &&
    releaseWorkflow.includes('NODE_AUTH_TOKEN:') &&
    releaseWorkflow.includes('secrets.NPM_BOOTSTRAP_TOKEN') &&
    releaseWorkflow.includes('TAG: ${{ github.event.release.tag_name }}'),
  'Release workflow must stage and verify one token-free archive, then publish that exact archive without lifecycle scripts from the sole credential-bearing step.',
);

const immutableTags = new Map([
  ['v0.1.0', '46355edd298613fc06be47db6e6ce19b14f62870'],
]);

for (const [tag, expectedCommit] of immutableTags) {
  let actualCommit;
  try {
    actualCommit = execFileSync('git', ['rev-parse', `${tag}^{commit}`], {
      encoding: 'utf8',
    }).trim();
  } catch {
    failures.push(`Required historical tag ${tag} is missing.`);
    continue;
  }
  requireCondition(
    actualCommit === expectedCommit,
    `Historical tag ${tag} moved: expected ${expectedCommit}, found ${actualCommit}.`,
  );
}

try {
  const candidateCommit = execFileSync(
    'git',
    ['rev-parse', '--verify', `${expectedTag}^{commit}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  ).trim();
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  requireCondition(
    candidateCommit === head,
    `Existing candidate tag ${expectedTag} does not point to HEAD.`,
  );
} catch {
  console.log(
    `Candidate tag ${expectedTag} has not been created; release preparation may continue.`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Release candidate ${expectedTag} metadata and publication guards pass.`,
);
