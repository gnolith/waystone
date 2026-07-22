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
      .mockResolvedValueOnce({
        ...page,
        readiness: 'lexical-only',
        degraded: true,
        notice: 'Semantic service unavailable.',
      })
      .mockRejectedValueOnce(
        new WaystoneRequestError('Invalid cursor', {
          kind: 'validation',
          status: 400,
        }),
      )
      .mockResolvedValueOnce({
        results: page.results,
        readiness: page.readiness,
      });
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
      query: 'orchid',
      filters: { language: 'fr' },
    });
    expect(query.mock.calls[2]?.[0]).not.toHaveProperty('cursor');
    expect(query.mock.calls[2]?.[0].kinds).toHaveLength(7);
    expect(screen.queryByLabelText(/search mode/i)).not.toBeInTheDocument();
  });

  it('hydrates every kind through its owning client operation', async () => {
    const client = createMockWaystoneClient();
    const getEntity = vi
      .spyOn(client.entities, 'get')
      .mockResolvedValue({} as never);
    const getTask = vi
      .spyOn(client.tasks, 'get')
      .mockResolvedValue({} as never);
    const getMemory = vi
      .spyOn(client.memories, 'get')
      .mockResolvedValue({} as never);
    const getPrompt = vi
      .spyOn(client.prompts, 'get')
      .mockResolvedValue({} as never);
    const getResource = vi
      .spyOn(client.resources, 'get')
      .mockResolvedValue({} as never);
    const getAnnotation = vi
      .spyOn(client.annotations, 'get')
      .mockResolvedValue({} as never);
    for (const result of results.filter(
      (value, index) => value.kind !== 'resource' || index === 5,
    ))
      await hydrateSearchResult(client, result);
    expect(getEntity).toHaveBeenCalledTimes(2);
    expect(getTask).toHaveBeenCalledWith('T1');
    expect(getMemory).toHaveBeenCalledWith('M1');
    expect(getPrompt).toHaveBeenCalledWith('PR1');
    expect(getResource).toHaveBeenCalledWith('R1');
    expect(getAnnotation).toHaveBeenCalledWith('A1');
  });

  it('keeps Resource, linked Item, Annotation, and Prompt identities visibly distinct and renders untrusted text safely', () => {
    const { rerender } = render(
      <ResourceView
        resource={{
          id: 'R1',
          revision: 2,
          title: '<img onerror=alert(1)>',
          linkedItemIds: ['Q1'],
          location: 'javascript:alert(1)',
          body: '<script>bad()</script>',
          selectedExcerpt: 'Exact excerpt',
        }}
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
        annotation={{
          id: 'A1',
          revision: 1,
          body: 'Small embedded annotation',
          bodyResource: { resourceId: 'R2' },
          targetId: 'R1',
          inheritedVisibility: 'private',
        }}
      />,
    );
    expect(
      screen.getByRole('link', { name: 'Resource R1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Resource R2' }),
    ).toBeInTheDocument();
    expect(screen.getByText('private')).toBeInTheDocument();
    rerender(
      <PromptView
        prompt={{
          id: 'PR1',
          revision: 3,
          title: 'Summarize',
          text: 'Use {{source}}',
          variables: ['source'],
        }}
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

  it('displays unknown costs and confirms budget, exclusion, retirement, deletion, and reconnect controls', async () => {
    const client = createMockWaystoneClient();
    client.search.admin.estimateBackfill = vi.fn().mockResolvedValue({
      estimateId: 'E1',
      items: 12,
      assumptions: ['Tokenizer estimate'],
    });
    const approveBackfill = vi.fn().mockResolvedValue(health);
    const excludeFailure = vi.fn().mockResolvedValue(health);
    const retireConfiguration = vi.fn().mockResolvedValue(health);
    const deleteEmbeddings = vi.fn().mockResolvedValue(health);
    const reconnectCircuit = vi.fn().mockResolvedValue(health);
    client.search.admin.approveBackfill = approveBackfill;
    client.search.admin.excludeFailure = excludeFailure;
    client.search.admin.retireConfiguration = retireConfiguration;
    client.search.admin.deleteEmbeddings = deleteEmbeddings;
    client.search.admin.reconnectCircuit = reconnectCircuit;
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<SearchAdministration client={client} health={health} />);
    fireEvent.click(screen.getByRole('button', { name: 'Estimate backfill' }));
    expect(
      await screen.findByText('Unknown — approval may still incur charges'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Approve backfill budget' }),
    );
    await waitFor(() => expect(approveBackfill).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Exclude' }));
    await waitFor(() => expect(excludeFailure).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole('button', { name: 'Retire configuration' }),
    );
    await waitFor(() => expect(retireConfiguration).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete retained embeddings' }),
    );
    await waitFor(() => expect(deleteEmbeddings).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    await waitFor(() =>
      expect(reconnectCircuit).toHaveBeenCalledWith('provider'),
    );
    expect(confirm).toHaveBeenCalledTimes(4);
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
    client.search.query = vi.fn().mockResolvedValue(page);
    const { container } = render(
      <main>
        <UnifiedSearchScreen client={client} initialQuery="orchid" />
        <SearchAdministration client={client} health={health} />
        <ResourceView resource={{ id: 'R1', revision: 1, title: 'Source' }} />
        <AnnotationView
          annotation={{ id: 'A1', revision: 1, targetId: 'R1', body: 'Note' }}
        />
        <PromptView
          prompt={{ id: 'P1', revision: 1, title: 'Prompt', text: 'Text' }}
        />
      </main>,
    );
    const audit = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(audit.violations).toEqual([]);
  });
});
