import { describe, expect, it, vi } from 'vitest';
import { createWaystoneClient } from '../../src/create-client.js';
import { WaystoneRequestError } from '../../src/errors.js';
import { fixtureItem } from '../../src/fixture-data.js';
import type { EntityMutationOperation } from '../../src/model.js';

describe('createWaystoneClient', () => {
  it('constructs configurable URLs and authentication without reading browser globals at import', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = createWaystoneClient({
      baseUrl: 'https://research.example/base/',
      fetch: fetcher,
      getAccessToken: () => 'secret',
      paths: { entities: 'knowledge/search' },
    });
    await client.entities.search({ query: 'Q1', language: 'en', limit: 10 });
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe(
      'https://research.example/base/knowledge/search?q=Q1&language=en&limit=10',
    );
    expect(new Headers(init?.headers).get('authorization')).toBe(
      'Bearer secret',
    );
  });
  it('sends expected revision and preserves conflicts and request IDs', async () => {
    const onMutationResult = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: 'revision changed' }), {
        status: 409,
        headers: { 'x-request-id': 'req-7' },
      }),
    );
    const client = createWaystoneClient({
      fetch: fetcher,
      observability: { onMutationResult },
    });
    await expect(
      client.entities.mutate('Q1', { operations: [] }, { expectedRevision: 6 }),
    ).rejects.toMatchObject({ kind: 'conflict', requestId: 'req-7' });
    const init = fetcher.mock.calls[0]![1];
    expect(new Headers(init?.headers).get('if-match')).toBe('"6"');
    expect(onMutationResult).toHaveBeenCalledWith({
      entityId: 'Q1',
      operation: '',
      ok: false,
      requestId: 'req-7',
    });
  });
  it('normalizes network failures', async () => {
    const client = createWaystoneClient({
      fetch: vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')),
    });
    await expect(client.entities.get('Q1')).rejects.toBeInstanceOf(
      WaystoneRequestError,
    );
    await expect(client.entities.get('Q1')).rejects.toMatchObject({
      kind: 'network',
    });
  });
  it('reports successful mutations through the vendor-neutral observability hook', async () => {
    const onMutationResult = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'Q1',
          type: 'item',
          labels: {},
          descriptions: {},
          aliases: {},
          statements: {},
          revision: 2,
          modified: '2026-07-20T00:00:00Z',
        }),
      ),
    );
    const client = createWaystoneClient({
      fetch: fetcher,
      observability: { onMutationResult },
    });
    await client.entities.mutate(
      'Q1',
      {
        operations: [{ op: 'set-label', language: 'en', value: 'Label' }],
      },
      { expectedRevision: 1 },
    );
    expect(onMutationResult).toHaveBeenCalledWith({
      entityId: 'Q1',
      operation: 'set-label',
      ok: true,
    });
  });
  it('serializes authored statement revision text without normalization', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(fixtureItem));
    const client = createWaystoneClient({ fetch: fetcher });
    await client.entities.mutate(
      'Q1',
      {
        operations: [
          {
            op: 'set-rank',
            statementId: 'Q1$preferred',
            rank: 'normal',
            text: '  Exact authored revision text.  ',
          },
        ],
      },
      { expectedRevision: 7 },
    );
    const body = fetcher.mock.calls[0]?.[1]?.body;
    expect(typeof body).toBe('string');
    expect(JSON.parse(body as string)).toEqual({
      operations: [
        {
          op: 'set-rank',
          statementId: 'Q1$preferred',
          rank: 'normal',
          text: '  Exact authored revision text.  ',
        },
      ],
    });
  });
  it.each([
    ['absent', undefined],
    ['empty', ''],
    ['Unicode whitespace', '\u00a0\u2003'],
  ])(
    'rejects %s statement revision text before transport',
    async (_case, text) => {
      const fetcher = vi.fn<typeof fetch>();
      const client = createWaystoneClient({ fetch: fetcher });
      const operation = {
        op: 'set-rank',
        statementId: 'Q1$preferred',
        rank: 'normal',
        text,
      } as EntityMutationOperation;
      await expect(
        client.entities.mutate(
          'Q1',
          { operations: [operation] },
          { expectedRevision: 7 },
        ),
      ).rejects.toMatchObject({ kind: 'validation' });
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it('decodes canonical Taproot envelopes returned by generated Site handlers', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        entity: {
          id: 'Q9',
          type: 'item',
          labels: { en: { language: 'en', value: 'Live record' } },
          descriptions: {},
          aliases: {},
          claims: {},
          sitelinks: {},
          lastrevid: 3,
          modified: '2026-07-20T00:00:00Z',
        },
        deletedAt: null,
        redirectTo: null,
      }),
    );
    const entity = await createWaystoneClient({ fetch: fetcher }).entities.get(
      'Q9',
    );
    expect(entity).toMatchObject({
      id: 'Q9',
      labels: { en: 'Live record' },
      revision: 3,
      statements: {},
    });
  });
});
