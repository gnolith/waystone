import assert from 'node:assert/strict';
import test from 'node:test';

async function render(path) {
  const consumerUrl = new URL('../dist/server/index.js', import.meta.url);
  consumerUrl.searchParams.set('test', `${process.pid}-${Date.now()}-${path}`);
  const { default: consumer } = await import(consumerUrl.href);
  return consumer(
    new Request(`http://localhost${path}`, {
      headers: { accept: 'text/html' },
    }),
  );
}

for (const [path, expected] of [
  ['/', 'Knowledge at a glance'],
  ['/onboarding', 'Set up this research Site'],
  ['/entities', 'Knowledge discovery'],
  ['/entities/Q1', 'Field specimen'],
  ['/properties/P1', 'related object'],
  ['/sparql', 'SPARQL'],
  ['/search', 'Search'],
  ['/resources/R1', 'Canary Resource'],
  ['/annotations/A1', 'Canary annotation'],
  ['/prompts/PROMPT1', 'Canary Prompt'],
]) {
  test(`server-renders ${path}`, async () => {
    const response = await render(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/i);
    const html = await response.text();
    assert.match(html, new RegExp(expected));
    assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
  });
}

test('server-renders the package fixture plugin', async () => {
  const response = await render('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Research work/);
  assert.match(html, /href="\/work"/);
});
