import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const serialSeed = `${manifest.name}@${manifest.version}:${lock.lockfileVersion}`;
const serial = createHash('sha256').update(serialSeed).digest('hex');
function packageName(location, value) {
  if (value?.name) return value.name;
  const marker = 'node_modules/';
  const index = location.lastIndexOf(marker);
  return index < 0 ? undefined : location.slice(index + marker.length);
}
const components = Object.entries(lock.packages ?? {})
  .filter(
    ([location, value]) =>
      location && packageName(location, value) && value?.version,
  )
  .map(([location, value]) => {
    const name = packageName(location, value);
    return {
      type: 'library',
      name,
      version: value.version,
      ...(value.integrity
        ? {
            hashes: [
              {
                alg: 'SHA-512',
                content: value.integrity.replace(/^sha512-/, ''),
              },
            ],
          }
        : {}),
      purl: `pkg:npm/${encodeURIComponent(name)}@${value.version}`,
    };
  })
  .concat(
    Object.entries(manifest.peerDependencies ?? {}).map(([name, version]) => ({
      type: 'library',
      name,
      version,
      scope: 'required',
      purl: `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`,
    })),
  )
  .sort((left, right) =>
    `${left.name}@${left.version}`.localeCompare(
      `${right.name}@${right.version}`,
    ),
  );
const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: `urn:uuid:${serial.slice(0, 8)}-${serial.slice(8, 12)}-${serial.slice(12, 16)}-${serial.slice(16, 20)}-${serial.slice(20, 32)}`,
  version: 1,
  metadata: {
    component: {
      type: 'library',
      name: manifest.name,
      version: manifest.version,
      licenses: [{ license: { id: manifest.license } }],
      purl: `pkg:npm/${encodeURIComponent(manifest.name)}@${manifest.version}`,
    },
  },
  components,
};
mkdirSync(path.resolve('dist'), { recursive: true });
writeFileSync(
  path.resolve('dist', 'waystone.cdx.json'),
  `${JSON.stringify(sbom, null, 2)}\n`,
  'utf8',
);
console.log(`CycloneDX SBOM generated with ${components.length} components.`);
