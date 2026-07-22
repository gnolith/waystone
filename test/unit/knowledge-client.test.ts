import { describe, expect, it, vi } from 'vitest';
import { createWaystoneClient } from '../../src/create-client.js';

describe('knowledge browser client', () => {
  it('serializes the single seven-kind search with repeated kinds, kind-aware filters, bounds, and opaque cursor', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ results: [] }));
    const client = createWaystoneClient({
      baseUrl: 'https://site.example/root/',
      fetch: fetcher,
    });
    await client.search.query({
      text: 'orchid',
      kinds: ['resource', 'annotation'],
      filters: {
        languages: ['fr'],
        sourceRevisions: ['r7'],
        byKind: { resource: { mediaTypes: ['text/plain'] } },
      },
      limit: 25,
      cursor: 'opaque+/=',
    });
    const requested = fetcher.mock.calls[0]?.[0];
    if (typeof requested !== 'string')
      throw new TypeError('Expected a string URL.');
    const url = new URL(requested);
    expect(url.pathname).toBe('/root/api/workshop/search');
    expect(fetcher.mock.calls[0]?.[1]?.method).toBe('POST');
    const body = fetcher.mock.calls[0]?.[1]?.body;
    if (typeof body !== 'string')
      throw new TypeError('Expected a JSON request body.');
    expect(JSON.parse(body)).toEqual({
      text: 'orchid',
      kinds: ['resource', 'annotation'],
      filters: {
        languages: ['fr'],
        sourceRevisions: ['r7'],
        byKind: { resource: { mediaTypes: ['text/plain'] } },
      },
      limit: 25,
      cursor: 'opaque+/=',
    });
  });

  it.each([0, 101, 1.5])(
    'rejects an unbounded/invalid page size %s before transport',
    (limit) => {
      const fetcher = vi.fn<typeof fetch>();
      const client = createWaystoneClient({ fetch: fetcher });
      expect(() => client.search.query({ text: 'x', limit })).toThrow(
        'Search page size must be between 1 and 100.',
      );
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it('provides create/read/update/history operations with revision preconditions', async () => {
    const visibility = { version: 1, clauses: [] } as const;
    const attribution = { id: 'human-1', kind: 'human' } as const;
    const authorization = {
      installationId: 'i1',
      workspaceId: null,
      ownerPrincipalId: 'human-1',
      policyRevision: 1,
      visibility,
    };
    const resource = {
      version: 1,
      id: 'R1',
      itemId: 'Q1',
      revision: 1,
      payload: { kind: 'inline-text', text: 'Body' },
      mediaType: 'text/plain',
      integrity: { algorithm: 'sha256', digest: 'abc', byteLength: 4 },
      attribution,
      authorization,
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
    };
    const annotation = {
      version: 1,
      id: 'A1',
      revision: 1,
      body: { kind: 'text', text: 'Note' },
      target: { kind: 'resource', sourceId: 'R1' },
      attribution,
      authorization,
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
    };
    const prompt = {
      id: 'P1',
      name: 'p',
      title: 'T',
      promptText: 'X',
      variables: {},
      active: true,
      priority: 0,
      order: 0,
      language: 'en',
      attribution: {},
      revision: 1,
      policyRevision: 1,
      installationId: 'i1',
      ownerPrincipalId: 'human-1',
      workspaceId: 'w1',
      visibility,
      authorizationRevision: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(resource))
      .mockResolvedValueOnce(Response.json({ ...resource, revision: 2 }))
      .mockResolvedValueOnce(Response.json(resource))
      .mockResolvedValueOnce(Response.json(annotation))
      .mockResolvedValueOnce(
        Response.json([
          {
            promptId: 'P1',
            revision: 1,
            prompt,
            actorPrincipalId: 'human-1',
            eventId: 'E1',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
      );
    const client = createWaystoneClient({ fetch: fetcher });
    await client.resources.create({
      id: 'R1',
      itemId: 'Q1',
      title: 'Source',
      payload: { kind: 'inline-text', text: 'Body' },
      mediaType: 'text/plain',
      integrity: { algorithm: 'sha256', digest: 'abc', byteLength: 4 },
    });
    await client.resources.update(
      'R1',
      { title: 'Changed' },
      { expectedRevision: 1 },
    );
    await client.resources.getRevision('R1', 1);
    await client.annotations.get('A1');
    await client.prompts.history('P1');
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      '/api/resources',
      '/api/resources/R1',
      '/api/resources/R1/revisions/1',
      '/api/annotations/A1',
      '/api/workshop/prompts/P1/history',
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
      .mockResolvedValueOnce(Response.json(health))
      .mockResolvedValueOnce(Response.json(health))
      .mockResolvedValueOnce(Response.json(health))
      .mockResolvedValueOnce(Response.json(health))
      .mockResolvedValueOnce(
        Response.json({ id: 'O1', kind: 'snapshot', state: 'pending' }),
      );
    const client = createWaystoneClient({ fetch: fetcher });
    await client.search.admin.inspect();
    await client.search.admin.execute({
      operation: 'materialize',
      maxJobs: 10,
      maxRebuildRoots: 5,
    });
    await client.search.admin.execute({
      operation: 'semantic-select',
      configurationId: 'C1',
    });
    await client.search.admin.execute({
      operation: 'semantic-delete-embeddings',
      configurationId: 'C1',
    });
    await client.hostOperations.start('snapshot');
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      '/api/workshop/search/admin',
      '/api/workshop/search/admin',
      '/api/workshop/search/admin',
      '/api/workshop/search/admin',
      '/api/operations',
    ]);
    expect(fetcher.mock.calls.map(([, init]) => init?.method)).toEqual([
      undefined,
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
    await expect(
      client.search.admin.execute({
        operation: 'semantic-run',
        planId: 'P1',
      }),
    ).rejects.toMatchObject({
      kind: 'permission',
      status: 403,
      requestId: 'denied-1',
    });
  });
});
