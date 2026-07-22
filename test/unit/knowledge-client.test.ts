import { describe, expect, it, vi } from 'vitest';
import { createWaystoneClient } from '../../src/create-client.js';

describe('knowledge browser client', () => {
  it('serializes the single seven-kind search with repeated kinds, kind-aware filters, bounds, and opaque cursor', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ results: [], readiness: 'lexical-only' }),
      );
    const client = createWaystoneClient({
      baseUrl: 'https://site.example/root/',
      fetch: fetcher,
    });
    await client.search.query({
      query: 'orchid',
      kinds: ['resource', 'annotation'],
      filters: {
        language: 'fr',
        mediaType: 'text/plain',
        motivation: 'commenting',
      },
      pageSize: 25,
      cursor: 'opaque+/=',
    });
    const requested = fetcher.mock.calls[0]?.[0];
    if (typeof requested !== 'string')
      throw new TypeError('Expected a string URL.');
    const url = new URL(requested);
    expect(url.pathname).toBe('/root/api/search');
    expect(url.searchParams.getAll('kind')).toEqual(['resource', 'annotation']);
    expect(url.searchParams.get('cursor')).toBe('opaque+/=');
    expect(url.searchParams.get('pageSize')).toBe('25');
    expect(url.searchParams.get('language')).toBe('fr');
    expect(url.searchParams.has('mode')).toBe(false);
  });

  it.each([0, 101, 1.5])(
    'rejects an unbounded/invalid page size %s before transport',
    (pageSize) => {
      const fetcher = vi.fn<typeof fetch>();
      const client = createWaystoneClient({ fetch: fetcher });
      expect(() => client.search.query({ query: 'x', pageSize })).toThrow(
        'Search page size must be between 1 and 100.',
      );
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it('provides create/read/update/history operations with revision preconditions', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ id: 'R1', revision: 1 }))
      .mockResolvedValueOnce(Response.json({ id: 'R1', revision: 2 }))
      .mockResolvedValueOnce(Response.json({ revisions: [] }))
      .mockResolvedValueOnce(
        Response.json({ id: 'A1', revision: 1, targetId: 'R1' }),
      )
      .mockResolvedValueOnce(
        Response.json({ id: 'P1', revision: 1, title: 'T', text: 'X' }),
      );
    const client = createWaystoneClient({ fetch: fetcher });
    await client.resources.create({ title: 'Source' });
    await client.resources.update(
      'R1',
      { title: 'Changed' },
      { expectedRevision: 1 },
    );
    await client.resources.listRevisions('R1');
    await client.annotations.get('A1');
    await client.prompts.getRevision('P1', 1);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      '/api/resources',
      '/api/resources/R1',
      '/api/resources/R1/revisions',
      '/api/annotations/A1',
      '/api/prompts/P1/revisions/1',
    ]);
    expect(
      new Headers(fetcher.mock.calls[1]?.[1]?.headers).get('if-match'),
    ).toBe('"1"');
  });

  it('uses bounded host-owned administration and data-operation endpoints', async () => {
    const health = {
      lexicalReady: true,
      semanticConfigured: false,
      semanticReady: false,
      adminAuthorized: true,
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ estimateId: 'E1', items: 3 }))
      .mockResolvedValueOnce(Response.json(health))
      .mockResolvedValueOnce(Response.json(health))
      .mockResolvedValueOnce(Response.json(health))
      .mockResolvedValueOnce(
        Response.json({ id: 'O1', kind: 'snapshot', state: 'pending' }),
      );
    const client = createWaystoneClient({ fetch: fetcher });
    await client.search.admin.estimateBackfill();
    await client.search.admin.approveBackfill('E1');
    await client.search.admin.control('pause');
    await client.search.admin.deleteEmbeddings('C1');
    await client.hostOperations.start('snapshot');
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      '/api/search/admin/estimate',
      '/api/search/admin/approve',
      '/api/search/admin/run',
      '/api/search/admin/embeddings/delete',
      '/api/operations',
    ]);
    expect(fetcher.mock.calls.map(([, init]) => init?.method)).toEqual([
      'POST',
      'POST',
      'POST',
      'POST',
      'POST',
    ]);
  });

  it('preserves authorization and server error distinctions for new operations', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { message: 'Exact admin only' },
          { status: 403, headers: { 'x-request-id': 'denied-1' } },
        ),
      );
    const client = createWaystoneClient({ fetch: fetcher });
    await expect(client.search.admin.control('play')).rejects.toMatchObject({
      kind: 'permission',
      status: 403,
      requestId: 'denied-1',
    });
  });
});
