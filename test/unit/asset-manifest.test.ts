import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { WaystoneAssetManifest } from '../../src/model.js';

function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(',')}}`;
}

describe('immutable browser assets', () => {
  it('verifies file bytes and the JCS manifest digest', () => {
    const manifest = JSON.parse(
      readFileSync('dist/waystone-assets.json', 'utf8'),
    ) as WaystoneAssetManifest;
    const { manifestSha256, ...unsigned } = manifest;
    expect(manifest.format).toBe('waystone-assets-v1');
    expect(manifest.files.map((file) => file.path)).toEqual(
      [...manifest.files.map((file) => file.path)].sort(),
    );
    expect(createHash('sha256').update(canonical(unsigned)).digest('hex')).toBe(
      manifestSha256,
    );
    for (const file of manifest.files) {
      expect(file.path).not.toMatch(
        /(?:^[/\\]|\\|[?#]|(?:^|\/)(?:\.{1,2}|%2e(?:%2e)?)(?:\/|$)|^[a-z]:)/i,
      );
      const bytes = readFileSync(path.join('dist', ...file.path.split('/')));
      expect(bytes.byteLength).toBe(file.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        file.sha256,
      );
      expect(file.immutable).toBe(true);
    }
    expect(
      manifest.files.some((file) => file.path === manifest.entrypoint),
    ).toBe(true);
  });
});
