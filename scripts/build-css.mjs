import { mkdir, readFile, writeFile } from 'node:fs/promises';
const files = [
  'src/styles/tokens.css',
  'src/styles/base.css',
  'src/styles/components.css',
];
await mkdir('dist', { recursive: true });
await writeFile(
  'dist/styles.css',
  `${(await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n')}\n`,
);
