import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { WaystoneRequestError } from '../../src/errors.js';
import { createMockWaystoneClient } from '../../src/fixture-data.js';
import {
  AnnotationView,
  HostOperationProgress,
  PromptView,
  ResourceView,
  SearchHealthView,
  UnifiedSearchResults,
  redactDiagnosticText,
} from '../../src/knowledge-components.js';
import {
  HostOperationsPanel,
  SearchAdministration,
  UnifiedSearchScreen,
  hydrateSearchResult,
} from '../../src/knowledge-client-components.js';
import type {
  SearchHealth,
  SearchPage,
  TaprootAnnotation,
  TaprootResource,
  WorkshopPrompt,
  UnifiedSearchPage,
  UnifiedSearchResult,
  WaystoneClient,
} from '../../src/model.js';

const results: UnifiedSearchResult[] = [
  {
    kind: 'statement',
    canonicalId: 'S1',
    statementId: 'S1',
    itemId: 'Q1',
    revision: 2,
    score: 99,
    snippet: 'statement chunk',
    contributingStatementIds: ['S1'],
  },
  {
    kind: 'item',
    canonicalId: 'Q1',
    itemId: 'Q1',
    revision: 3,
    score: 8,
    label: 'Item result',
    snippet: 'item chunk',
  },
  {
    kind: 'task',
    canonicalId: 'T1',
    taskId: 'T1',
    revision: 4,
    score: 7,
    title: 'Task result',
    snippet: 'task chunk',
  },
  {
    kind: 'memory',
    canonicalId: 'M1',
    memoryId: 'M1',
    revision: 5,
    score: 6,
    title: 'Memory result',
    snippet: 'memory chunk',
  },
  {
    kind: 'prompt',
    canonicalId: 'PR1',
    promptId: 'PR1',
    revision: 6,
    score: 5,
    title: 'Prompt result',
    snippet: 'prompt chunk',
  },
  {
    kind: 'resource',
    canonicalId: 'R1',
    resourceId: 'R1',
    revision: 7,
    score: 4,
    title: 'Resource result',
    mediaType: 'text/plain',
    language: 'en',
    selector: { type: 'text-position', start: 1, end: 20 },
    snippet: 'same source chunk one',
  },
  {
    kind: 'resource',
    canonicalId: 'R1',
    resourceId: 'R1',
    revision: 7,
    score: 3,
    title: 'Resource result',
    snippet: 'same source chunk two',
  },
  {
    kind: 'annotation',
    canonicalId: 'A1',
    annotationId: 'A1',
    targetId: 'R1',
    revision: 8,
    score: 2,
    motivation: 'commenting',
    selector: { type: 'fragment', value: 'page=1' },
    snippet: 'annotation chunk',
  },
];

const page: UnifiedSearchPage = {
  results,
  nextCursor: 'opaque-next',
  readiness: 'semantic-augmented',
};
const protocolPage: SearchPage = {
  results: results.map((result) => ({
    kind: result.kind,
    sourceId: result.canonicalId,
    sourceRevision: String(result.revision),
    score: result.score,
    snippet: result.snippet ?? '',
    ...(result.title ? { title: result.title } : {}),
    ...(result.language ? { language: result.language } : {}),
    ...(result.contributingStatementIds
      ? {
          match: {
            contributingStatementIds: [...result.contributingStatementIds],
          },
        }
      : {}),
  })),
  cursor: 'opaque-next',
};

const health: SearchHealth = {
  lexicalReady: true,
  semanticConfigured: true,
  semanticReady: false,
  selectedConfiguration: 'embedding-v2',
  coverage: { indexed: 4, total: 10 },
  pendingWork: 6,
  schedules: [{ id: 'nightly', state: 'paused' }],
  failures: [
    {
      id: 'F1',
      kind: 'resource',
      message: 'Authorization=secret-value failed',
      attempts: 2,
    },
  ],
  circuits: [{ id: 'provider', state: 'open', reason: 'Bearer abc.def' }],
  workers: [{ worker: 'indexer', completed: 4, total: 10, state: 'running' }],
  adminAuthorized: true,
};

const visibility = { version: 1 as const, clauses: [] as const };
const attribution = {
  id: 'human-1',
  kind: 'human' as const,
  name: 'Researcher',
};
const authorization = {
  installationId: 'site-1',
  workspaceId: null,
  ownerPrincipalId: 'human-1',
  policyRevision: 1,
  visibility,
};
function resourceFixture(
  overrides: Partial<TaprootResource> = {},
): TaprootResource {
  return {
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
    ...overrides,
  };
}
function annotationFixture(
  overrides: Partial<TaprootAnnotation> = {},
): TaprootAnnotation {
  return {
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
    ...overrides,
  };
}
function promptFixture(
  overrides: Partial<WorkshopPrompt> = {},
): WorkshopPrompt {
  return {
    id: 'P1',
    name: 'prompt',
    title: 'Prompt',
    promptText: 'Text',
    variables: {},
    active: true,
    priority: 0,
    order: 0,
    language: 'en',
    attribution: {},
    revision: 1,
    policyRevision: 1,
    installationId: 'site-1',
    ownerPrincipalId: 'human-1',
    workspaceId: 'workspace-1',
    visibility,
    authorizationRevision: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('unified knowledge contract UI', () => {
  it('renders every result kind, traceability, and independently ranked chunks without deduplication', () => {
    render(<UnifiedSearchResults page={page} />);
    for (const kind of [
      'statement',
      'item',
      'task',
      'memory',
      'prompt',
      'resource',
      'annotation',
    ])
      expect(screen.getAllByText(kind).length).toBeGreaterThan(0);
    expect(screen.getByText('same source chunk one')).toBeInTheDocument();
    expect(screen.getByText('same source chunk two')).toBeInTheDocument();
    expect(screen.getByText('Contributing statements: S1')).toBeInTheDocument();
    expect(screen.getByText('Semantic-augmented search')).toBeInTheDocument();
    expect(screen.queryByText(/99%/)).not.toBeInTheDocument();
  });

  it('keeps filters and kind selection when explicitly recovering from an invalid cursor', async () => {
    const query = vi
      .fn<WaystoneClient['search']['query']>()
      .mockResolvedValueOnce(protocolPage)
      .mockRejectedValueOnce(
        new WaystoneRequestError('Invalid cursor', {
          kind: 'validation',
          status: 400,
        }),
      )
      .mockResolvedValueOnce({ results: protocolPage.results });
    const client = createMockWaystoneClient();
    client.search.query = query;
    render(<UnifiedSearchScreen client={client} initialQuery="orchid" />);
    fireEvent.change(screen.getByLabelText('Language'), {
      target: { value: 'fr' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Lexical-only search')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid cursor',
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Restart this same query/ }),
    );
    await waitFor(() => expect(query).toHaveBeenCalledTimes(3));
    expect(query.mock.calls[2]?.[0]).toMatchObject({
      text: 'orchid',
      filters: { languages: ['fr'] },
    });
    expect(query.mock.calls[2]?.[0]).not.toHaveProperty('cursor');
    expect(query.mock.calls[2]?.[0].kinds).toHaveLength(7);
    expect(screen.queryByLabelText(/search mode/i)).not.toBeInTheDocument();
  });

  it('hydrates every kind through its owning client operation', async () => {
    const client = createMockWaystoneClient();
    const hydrate = vi
      .spyOn(client.search, 'hydrate')
      .mockResolvedValue({} as never);
    for (const result of results.filter(
      (value, index) => value.kind !== 'resource' || index === 5,
    ))
      await hydrateSearchResult(client, result);
    expect(hydrate).toHaveBeenCalledTimes(7);
    expect(hydrate).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'prompt', sourceId: 'PR1' }),
    );
  });

  it('keeps Resource, linked Item, Annotation, and Prompt identities visibly distinct and renders untrusted text safely', () => {
    const { rerender } = render(
      <ResourceView
        resource={resourceFixture({
          revision: 2,
          title: '<img onerror=alert(1)>',
          payload: { kind: 'inline-text', text: '<script>bad()</script>' },
        })}
      />,
    );
    expect(screen.getByRole('link', { name: 'Item Q1' })).toHaveAttribute(
      'href',
      '/entities/Q1',
    );
    expect(
      screen.queryByRole('link', { name: 'javascript:alert(1)' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('<script>bad()</script>')).toBeInTheDocument();
    rerender(
      <AnnotationView
        annotation={annotationFixture({
          body: { kind: 'resource', resourceId: 'R2' },
        })}
      />,
    );
    expect(
      screen.getByRole('link', { name: 'resource R1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Resource R2' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);
    rerender(
      <PromptView
        prompt={promptFixture({
          id: 'PR1',
          revision: 3,
          title: 'Summarize',
          promptText: 'Use {{source}}',
          variables: { source: { type: 'string' } },
        })}
      />,
    );
    expect(screen.getByText('Use {{source}}')).toBeInTheDocument();
  });

  it('redacts credential-bearing diagnostics and shows complete health state', () => {
    render(<SearchHealthView health={health} />);
    expect(screen.getByText(/Authorization=\[redacted\]/)).toBeInTheDocument();
    expect(screen.queryByText(/secret-value/)).not.toBeInTheDocument();
    expect(screen.queryByText(/abc\.def/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/4 of 10/)).toHaveLength(2);
    expect(redactDiagnosticText('password=hunter2')).toBe(
      'password=[redacted]',
    );
  });

  it('hides exact-admin controls when unauthorized', () => {
    render(
      <SearchAdministration
        client={createMockWaystoneClient()}
        health={{ ...health, adminAuthorized: false }}
      />,
    );
    expect(
      screen.queryByRole('heading', { name: 'Search administration' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Delete retained/ }),
    ).not.toBeInTheDocument();
  });

  it('does not invent required search administration operation fields', () => {
    render(
      <SearchAdministration
        client={createMockWaystoneClient()}
        health={health}
      />,
    );
    expect(screen.getByText(/exact typed operations/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('presents host-only operation progress and requires restore confirmation', async () => {
    const client = createMockWaystoneClient();
    client.hostOperations.start = vi.fn().mockResolvedValue({
      id: 'O2',
      kind: 'restore',
      state: 'running',
      completed: 1,
      total: 3,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { rerender } = render(
      <HostOperationProgress
        operation={{
          id: 'O1',
          kind: 'snapshot',
          state: 'failed',
          message: 'api_key=topsecret',
        }}
      />,
    );
    expect(screen.queryByText(/topsecret/)).not.toBeInTheDocument();
    rerender(<HostOperationsPanel client={client} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start restore' }));
    expect(await screen.findByText('running')).toBeInTheDocument();
  });

  it('has no automated accessibility violations across search, health, and typed content', async () => {
    const client = createMockWaystoneClient();
    client.search.query = vi.fn().mockResolvedValue(protocolPage);
    const { container } = render(
      <main>
        <UnifiedSearchScreen client={client} initialQuery="orchid" />
        <SearchAdministration client={client} health={health} />
        <ResourceView resource={resourceFixture({ title: 'Source' })} />
        <AnnotationView annotation={annotationFixture()} />
        <PromptView prompt={promptFixture()} />
      </main>,
    );
    const audit = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(audit.violations).toEqual([]);
  });
});
