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
const publishCommand =
  'npm publish "$ARCHIVE" --ignore-scripts --access public --provenance';
const stageJobIndex = releaseWorkflow.indexOf('\n  stage:');
const publishJobIndex = releaseWorkflow.indexOf('\n  publish:');
const stageJob = releaseWorkflow.slice(stageJobIndex, publishJobIndex);
const publishJob = releaseWorkflow.slice(publishJobIndex);

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
  stageJobIndex >= 0 &&
    publishJobIndex > stageJobIndex &&
    stageJob.includes('npm run check') &&
    stageJob.includes(packCommand) &&
    stageJob.includes('sha256sum') &&
    stageJob.includes('archive="waystone-${version}-${digest}.tgz"') &&
    stageJob.includes('artifact=waystone-${digest}') &&
    stageJob.includes('npm publish "$archive" --dry-run --ignore-scripts') &&
    stageJob.includes(
      'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    ) &&
    publishJob.includes('needs: stage') &&
    publishJob.includes('environment: npm') &&
    publishJob.includes('permissions:\n      id-token: write\n    steps:') &&
    !publishJob.includes('contents:') &&
    !publishJob.includes('actions:') &&
    !publishJob.includes('packages:') &&
    publishJob.includes(
      'actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093',
    ) &&
    !publishJob.includes('actions/checkout@') &&
    !publishJob.includes('npm run ') &&
    !publishJob.includes('npm pack ') &&
    publishJob.includes('EXPECTED_DIGEST: ${{ needs.stage.outputs.digest }}') &&
    publishJob.includes('RELEASE_TAG: ${{ github.event.release.tag_name }}') &&
    publishJob.includes("expected_name='@gnolith/waystone'") &&
    publishJob.includes('expected_version="${RELEASE_TAG#v}"') &&
    publishJob.includes('^v(0|[1-9][0-9]*)') &&
    !publishJob.includes('needs.stage.outputs.package_name') &&
    !publishJob.includes('needs.stage.outputs.version') &&
    publishJob.includes('test -f "$archive"') &&
    publishJob.includes('test ! -L "$archive"') &&
    publishJob.includes('sha256sum "$archive"') &&
    publishJob.includes('Archive member path is absolute.') &&
    publishJob.includes(
      'Archive member path contains traversal or ambiguous components.',
    ) &&
    publishJob.includes('Archive member path contains a backslash.') &&
    publishJob.includes('Archive member path contains a control character.') &&
    publishJob.includes('Archive member is outside package/.') &&
    publishJob.includes('Duplicate archive member path.') &&
    publishJob.includes('Archive contains a symlink or non-regular member.') &&
    publishJob.includes(
      'Archive must contain exactly one regular package/package.json.',
    ) &&
    publishJob.includes('package/package.json') &&
    publishJob.includes('archive="$(realpath "$archive")"') &&
    publishJob.includes('echo "archive=$archive" >> "$GITHUB_OUTPUT"') &&
    publishJob.includes(publishCommand) &&
    (releaseWorkflow.match(/NODE_AUTH_TOKEN:/g) ?? []).length === 1 &&
    (releaseWorkflow.match(/secrets\.NPM_BOOTSTRAP_TOKEN/g) ?? []).length ===
      1 &&
    releaseWorkflow.includes('TAG: ${{ github.event.release.tag_name }}'),
  'Release workflow must pass a content-addressed archive from a token-free stage job to a fresh protected job that revalidates it and only publishes the absolute archive without lifecycle scripts.',
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
