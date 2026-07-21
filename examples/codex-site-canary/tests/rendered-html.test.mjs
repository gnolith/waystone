import assert from 'node:assert/strict';
import test from 'node:test';

async function render(path) {
  const workerUrl = new URL('../dist/server/index.js', import.meta.url);
  workerUrl.searchParams.set('test', `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: 'text/html' },
    }),
    {
      ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

for (const [path, expected] of [
  ['/', 'Knowledge at a glance'],
  ['/onboarding', 'Set up this research Site'],
  ['/entities', 'Knowledge discovery'],
  ['/entities/Q1', 'Field specimen'],
  ['/properties/P1', 'related object'],
  ['/sparql', 'SPARQL'],
]) {
  test(`server-renders ${path}`, async () => {
    const response = await render(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/i);
    const html = await response.text();
    assert.match(html, new RegExp(expected));
    assert.doesNotMatch(
      html,
      /codex-preview|react-loading-skeleton|nodejs_compat/,
    );
  });
}

test('server-renders the real Workshop UI plugin', async () => {
  const response = await render('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Research Workshop/);
  assert.match(html, /href="\/workshop\/tasks"/);
});
