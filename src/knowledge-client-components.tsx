'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { publicErrorMessage } from './errors.js';
import {
  HostOperationProgress,
  SearchHealthView,
  UnifiedSearchResults,
} from './knowledge-components.js';
import {
  SEARCH_KINDS,
  type AnnotationInput,
  type AnnotationRecord,
  type BackfillEstimate,
  type HostOperation,
  type HostOperationKind,
  type PromptInput,
  type PromptRecord,
  type ResourceInput,
  type ResourceRecord,
  type SearchHealth,
  type SearchKind,
  type SearchRunAction,
  type UnifiedSearchInput,
  type UnifiedSearchPage,
  type UnifiedSearchResult,
  type WaystoneClient,
} from './model.js';

export async function hydrateSearchResult(
  client: WaystoneClient,
  result: UnifiedSearchResult,
): Promise<unknown> {
  switch (result.kind) {
    case 'statement':
      return client.entities.get(result.itemId);
    case 'item':
      return client.entities.get(result.itemId);
    case 'task':
      return client.tasks.get(result.taskId);
    case 'memory':
      return client.memories.get(result.memoryId);
    case 'prompt':
      return client.prompts.get(result.promptId);
    case 'resource':
      return client.resources.get(result.resourceId);
    case 'annotation':
      return client.annotations.get(result.annotationId);
  }
}

export function UnifiedSearchScreen({
  client,
  initialQuery = '',
  initialKinds = SEARCH_KINDS,
  onHydrated,
}: {
  client: WaystoneClient;
  initialQuery?: string;
  initialKinds?: readonly SearchKind[];
  onHydrated?: (value: unknown, result: UnifiedSearchResult) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kinds, setKinds] = useState<readonly SearchKind[]>(initialKinds);
  const [language, setLanguage] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [motivation, setMotivation] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [cursor, setCursor] = useState('');
  const [page, setPage] = useState<UnifiedSearchPage>();
  const [lastInput, setLastInput] = useState<UnifiedSearchInput>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const resultsFocus = useRef<HTMLDivElement>(null);
  const errorFocus = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (error) errorFocus.current?.focus();
    else if (page) resultsFocus.current?.focus();
  }, [error, page]);

  async function run(input: UnifiedSearchInput) {
    setLoading(true);
    setError(undefined);
    setLastInput(input);
    try {
      setPage(await client.search.query(input));
      setCursor(input.cursor ?? '');
    } catch (cause) {
      setPage(undefined);
      setError(cause);
    } finally {
      setLoading(false);
    }
  }

  function inputFor(nextCursor?: string): UnifiedSearchInput {
    return {
      query,
      kinds,
      pageSize,
      filters: {
        ...(language ? { language } : {}),
        ...(mediaType ? { mediaType } : {}),
        ...(motivation ? { motivation } : {}),
      },
      ...(nextCursor ? { cursor: nextCursor } : {}),
    };
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(inputFor(cursor || undefined));
  }

  function toggleKind(kind: SearchKind) {
    setKinds((selected) =>
      selected.includes(kind)
        ? selected.filter((value) => value !== kind)
        : [...selected, kind],
    );
  }

  const resourceFilters = kinds.includes('resource');
  const annotationFilters = kinds.includes('annotation');
  return (
    <section className="ws-unified-search" aria-labelledby={`${id}-title`}>
      <header>
        <p className="ws-eyebrow">Knowledge discovery</p>
        <h1 id={`${id}-title`}>Search</h1>
        <p>
          Search all supported knowledge kinds. Relevance scores determine
          ordering and are not percentages.
        </p>
      </header>
      <form onSubmit={submit}>
        <label htmlFor={`${id}-query`}>Search text</label>
        <input
          id={`${id}-query`}
          required
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <fieldset>
          <legend>Result kinds</legend>
          <div className="ws-kind-grid">
            {SEARCH_KINDS.map((kind) => (
              <label key={kind}>
                <input
                  type="checkbox"
                  checked={kinds.includes(kind)}
                  onChange={() => toggleKind(kind)}
                />
                {kind[0]?.toUpperCase()}
                {kind.slice(1)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="ws-filter-grid">
          <label>
            Language{' '}
            <input
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              placeholder="en"
            />
          </label>
          {resourceFilters && (
            <label>
              Resource media type{' '}
              <input
                value={mediaType}
                onChange={(event) => setMediaType(event.target.value)}
                placeholder="text/plain"
              />
            </label>
          )}
          {annotationFilters && (
            <label>
              Annotation motivation{' '}
              <input
                value={motivation}
                onChange={(event) => setMotivation(event.target.value)}
                placeholder="commenting"
              />
            </label>
          )}
          <label>
            Results per page{' '}
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
            />
          </label>
          <label>
            Continuation cursor{' '}
            <input
              value={cursor}
              onChange={(event) => setCursor(event.target.value)}
              aria-describedby={`${id}-cursor-hint`}
            />
          </label>
          <p className="ws-hint" id={`${id}-cursor-hint`}>
            Cursors are opaque. Clear this field only to explicitly restart from
            the first page.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim() || kinds.length === 0}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {loading && (
        <p role="status" aria-live="polite">
          Loading search results…
        </p>
      )}
      {error !== undefined && (
        <div
          className="ws-alert ws-alert--danger"
          role="alert"
          tabIndex={-1}
          ref={errorFocus}
        >
          <strong>Search failed</strong>
          <p>{publicErrorMessage(error)}</p>
          {lastInput?.cursor && (
            <button
              type="button"
              onClick={() => {
                const sameQuery: UnifiedSearchInput = { ...lastInput };
                delete sameQuery.cursor;
                void run(sameQuery);
              }}
            >
              Restart this same query without its stale cursor
            </button>
          )}
        </div>
      )}
      {page && (
        <div tabIndex={-1} ref={resultsFocus}>
          <UnifiedSearchResults
            page={page}
            onNavigate={(result) => {
              void hydrateSearchResult(client, result)
                .then((value) => onHydrated?.(value, result))
                .catch(() => undefined);
            }}
          />
          {page.nextCursor && (
            <button
              type="button"
              onClick={() => {
                const nextCursor = page.nextCursor;
                if (nextCursor)
                  void run({
                    ...(lastInput ?? inputFor()),
                    cursor: nextCursor,
                  });
              }}
            >
              Next page
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ErrorAlert({ error }: { error?: unknown }) {
  return error === undefined ? null : (
    <div className="ws-alert ws-alert--danger" role="alert">
      <p>{publicErrorMessage(error)}</p>
    </div>
  );
}

export function ResourceEditor({
  client,
  resource,
  onSaved,
}: {
  client: WaystoneClient;
  resource?: ResourceRecord;
  onSaved?: (value: ResourceRecord) => void;
}) {
  const [title, setTitle] = useState(resource?.title ?? '');
  const [body, setBody] = useState(resource?.body ?? '');
  const [location, setLocation] = useState(resource?.location ?? '');
  const [integrity, setIntegrity] = useState(resource?.integrity ?? '');
  const [language, setLanguage] = useState(resource?.language ?? '');
  const [mediaType, setMediaType] = useState(resource?.mediaType ?? '');
  const [selectedExcerpt, setSelectedExcerpt] = useState(
    resource?.selectedExcerpt ?? '',
  );
  const [metadata, setMetadata] = useState(
    resource?.metadata ? JSON.stringify(resource.metadata, null, 2) : '',
  );
  const [linkedItems, setLinkedItems] = useState(
    resource?.linkedItemIds?.join(', ') ?? '',
  );
  const [error, setError] = useState<unknown>();
  async function save(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    let parsedMetadata: Record<string, string> | undefined;
    try {
      if (metadata.trim()) {
        const value: unknown = JSON.parse(metadata);
        if (
          !value ||
          typeof value !== 'object' ||
          Array.isArray(value) ||
          Object.values(value).some((item) => typeof item !== 'string')
        )
          throw new TypeError('Metadata must be an object of string values.');
        parsedMetadata = value as Record<string, string>;
      }
    } catch (cause) {
      setError(cause);
      return;
    }
    const input: ResourceInput = {
      title,
      body,
      location,
      integrity,
      language,
      mediaType,
      selectedExcerpt,
      ...(parsedMetadata ? { metadata: parsedMetadata } : {}),
      linkedItemIds: linkedItems
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    };
    try {
      onSaved?.(
        resource
          ? await client.resources.update(resource.id, input, {
              expectedRevision: resource.revision,
            })
          : await client.resources.create(input),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <form className="ws-editor" onSubmit={(event) => void save(event)}>
      <h2>{resource ? 'Edit Resource' : 'Create Resource'}</h2>
      <label>
        Title{' '}
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Body{' '}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <label>
        Location{' '}
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          inputMode="url"
        />
      </label>
      <label>
        Integrity{' '}
        <input
          value={integrity}
          onChange={(event) => setIntegrity(event.target.value)}
        />
      </label>
      <label>
        Language{' '}
        <input
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        />
      </label>
      <label>
        Media type{' '}
        <input
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value)}
        />
      </label>
      <label>
        Metadata (JSON object with string values){' '}
        <textarea
          value={metadata}
          onChange={(event) => setMetadata(event.target.value)}
          spellCheck={false}
        />
      </label>
      <label>
        Meaningful selected excerpt{' '}
        <textarea
          value={selectedExcerpt}
          onChange={(event) => setSelectedExcerpt(event.target.value)}
        />
      </label>
      <label>
        Linked Item IDs, comma separated{' '}
        <input
          value={linkedItems}
          onChange={(event) => setLinkedItems(event.target.value)}
        />
      </label>
      <button type="submit">Save Resource</button>
      <ErrorAlert error={error} />
    </form>
  );
}

export function AnnotationEditor({
  client,
  annotation,
  onSaved,
}: {
  client: WaystoneClient;
  annotation?: AnnotationRecord;
  onSaved?: (value: AnnotationRecord) => void;
}) {
  const [body, setBody] = useState(annotation?.body ?? '');
  const [bodyResourceId, setBodyResourceId] = useState(
    annotation?.bodyResource?.resourceId ?? '',
  );
  const [targetId, setTargetId] = useState(annotation?.targetId ?? '');
  const [selector, setSelector] = useState(
    annotation?.selector && 'value' in annotation.selector
      ? (annotation.selector.value ?? '')
      : '',
  );
  const [motivation, setMotivation] = useState(annotation?.motivation ?? '');
  const [attributedTo, setAttributedTo] = useState(
    annotation?.attributedTo ?? '',
  );
  const [language, setLanguage] = useState(annotation?.language ?? '');
  const [mediaType, setMediaType] = useState(annotation?.mediaType ?? '');
  const [error, setError] = useState<unknown>();
  async function save(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    const input: AnnotationInput = {
      targetId,
      body,
      ...(bodyResourceId
        ? { bodyResource: { resourceId: bodyResourceId } }
        : {}),
      ...(selector ? { selector: { type: 'fragment', value: selector } } : {}),
      motivation,
      attributedTo,
      language,
      mediaType,
    };
    try {
      onSaved?.(
        annotation
          ? await client.annotations.update(annotation.id, input, {
              expectedRevision: annotation.revision,
            })
          : await client.annotations.create(input),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <form className="ws-editor" onSubmit={(event) => void save(event)}>
      <h2>{annotation ? 'Edit Annotation' : 'Create Annotation'}</h2>
      <label>
        Small embedded body{' '}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <label>
        Body Resource ID for durable works{' '}
        <input
          value={bodyResourceId}
          onChange={(event) => setBodyResourceId(event.target.value)}
        />
      </label>
      <label>
        Target Resource ID{' '}
        <input
          required
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
        />
      </label>
      <label>
        Fragment selector{' '}
        <input
          value={selector}
          onChange={(event) => setSelector(event.target.value)}
        />
      </label>
      <label>
        Motivation{' '}
        <input
          value={motivation}
          onChange={(event) => setMotivation(event.target.value)}
        />
      </label>
      <label>
        Attributed to{' '}
        <input
          value={attributedTo}
          onChange={(event) => setAttributedTo(event.target.value)}
        />
      </label>
      <label>
        Language{' '}
        <input
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        />
      </label>
      <label>
        Media type{' '}
        <input
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value)}
        />
      </label>
      <button type="submit">Save Annotation</button>
      <ErrorAlert error={error} />
    </form>
  );
}

export function PromptEditor({
  client,
  prompt,
  onSaved,
}: {
  client: WaystoneClient;
  prompt?: PromptRecord;
  onSaved?: (value: PromptRecord) => void;
}) {
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [text, setText] = useState(prompt?.text ?? '');
  const [language, setLanguage] = useState(prompt?.language ?? '');
  const [variables, setVariables] = useState(
    prompt?.variables?.join(', ') ?? '',
  );
  const [error, setError] = useState<unknown>();
  async function save(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    const input: PromptInput = {
      title,
      text,
      language,
      variables: variables
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    };
    try {
      onSaved?.(
        prompt
          ? await client.prompts.update(prompt.id, input, {
              expectedRevision: prompt.revision,
            })
          : await client.prompts.create(input),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <form className="ws-editor" onSubmit={(event) => void save(event)}>
      <h2>{prompt ? 'Edit Prompt' : 'Create Prompt'}</h2>
      <label>
        Title{' '}
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Prompt text{' '}
        <textarea
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <label>
        Language{' '}
        <input
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        />
      </label>
      <label>
        Variables, comma separated{' '}
        <input
          value={variables}
          onChange={(event) => setVariables(event.target.value)}
        />
      </label>
      <button type="submit">Save Prompt</button>
      <ErrorAlert error={error} />
    </form>
  );
}

export function SearchAdministration({
  client,
  health: initialHealth,
}: {
  client: WaystoneClient;
  health: SearchHealth;
}) {
  const [health, setHealth] = useState(initialHealth);
  const [estimate, setEstimate] = useState<BackfillEstimate>();
  const [configuration, setConfiguration] = useState(
    initialHealth.selectedConfiguration ?? '',
  );
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  if (!health.adminAuthorized) return <SearchHealthView health={health} />;
  async function act(operation: () => Promise<SearchHealth>) {
    setBusy(true);
    setError(undefined);
    try {
      setHealth(await operation());
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  async function estimateBackfill() {
    setBusy(true);
    setError(undefined);
    try {
      setEstimate(await client.search.admin.estimateBackfill());
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  function confirmed(message: string, operation: () => Promise<SearchHealth>) {
    if (window.confirm(message)) void act(operation);
  }
  const controls: SearchRunAction[] = ['play', 'resume', 'pause', 'stop'];
  return (
    <section className="ws-admin">
      <SearchHealthView health={health} />
      <h2>Search administration</h2>
      <ErrorAlert error={error} />
      <div className="ws-actions">
        <button
          disabled={busy}
          type="button"
          onClick={() => void estimateBackfill()}
        >
          Estimate backfill
        </button>
        {controls.map((action) => (
          <button
            disabled={busy}
            type="button"
            key={action}
            onClick={() => void act(() => client.search.admin.control(action))}
          >
            {action}
          </button>
        ))}
      </div>
      <label>
        Configuration ID{' '}
        <input
          value={configuration}
          onChange={(event) => setConfiguration(event.target.value)}
        />
      </label>
      <div className="ws-actions">
        <button
          disabled={busy || !configuration}
          type="button"
          onClick={() =>
            void act(() =>
              client.search.admin.selectConfiguration(configuration),
            )
          }
        >
          Select configuration
        </button>
        <button
          disabled={busy || !configuration}
          type="button"
          onClick={() =>
            confirmed(
              `Retire configuration ${configuration}? New work will no longer use it.`,
              () => client.search.admin.retireConfiguration(configuration),
            )
          }
        >
          Retire configuration
        </button>
        <button
          className="ws-button--danger"
          disabled={busy || !configuration}
          type="button"
          onClick={() =>
            confirmed(
              `Permanently delete retained embeddings for ${configuration}?`,
              () => client.search.admin.deleteEmbeddings(configuration),
            )
          }
        >
          Delete retained embeddings
        </button>
      </div>
      {estimate && (
        <section className="ws-estimate">
          <h3>Backfill estimate</h3>
          <dl className="ws-metadata">
            <div>
              <dt>Items</dt>
              <dd>{estimate.items}</dd>
            </div>
            <div>
              <dt>Tokens</dt>
              <dd>{estimate.tokens ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Cost</dt>
              <dd>
                {estimate.cost
                  ? `${estimate.cost.amount} ${estimate.cost.currency}`
                  : 'Unknown — approval may still incur charges'}
              </dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>
                {estimate.durationSeconds === undefined
                  ? 'Unknown'
                  : `${estimate.durationSeconds} seconds`}
              </dd>
            </div>
          </dl>
          {estimate.assumptions?.length ? (
            <ul>
              {estimate.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            onClick={() =>
              confirmed(
                'Approve this backfill budget using the displayed assumptions?',
                () => client.search.admin.approveBackfill(estimate.estimateId),
              )
            }
          >
            Approve backfill budget
          </button>
        </section>
      )}
      {health.failures?.map((failure) => (
        <div className="ws-actions" key={failure.id}>
          <span>
            {failure.kind} ({failure.id})
          </span>
          <button
            type="button"
            onClick={() =>
              void act(() => client.search.admin.retryFailure(failure.id))
            }
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() =>
              confirmed(
                `Exclude failure ${failure.id}? It will remain visible in status.`,
                () => client.search.admin.excludeFailure(failure.id),
              )
            }
          >
            Exclude
          </button>
        </div>
      ))}
      {health.circuits?.map((circuit) => (
        <div className="ws-actions" key={circuit.id}>
          <span>
            {circuit.id}: {circuit.state}
          </span>
          <button
            type="button"
            onClick={() =>
              void act(() => client.search.admin.reconnectCircuit(circuit.id))
            }
          >
            Reconnect
          </button>
        </div>
      ))}
    </section>
  );
}

export function HostOperationsPanel({
  client,
  initialOperations = [],
}: {
  client: WaystoneClient;
  initialOperations?: readonly HostOperation[];
}) {
  const [operations, setOperations] = useState(initialOperations);
  const [error, setError] = useState<unknown>();
  const kinds: HostOperationKind[] = [
    'snapshot',
    'export',
    'import',
    'restore',
  ];
  async function start(kind: HostOperationKind) {
    setError(undefined);
    if (
      (kind === 'import' || kind === 'restore') &&
      !window.confirm(
        `Start ${kind}? Existing Site state may be changed by the host.`,
      )
    )
      return;
    try {
      const operation = await client.hostOperations.start(kind);
      setOperations((values) => [...values, operation]);
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <section>
      <h2>Site data operations</h2>
      <p>
        Operations are performed by the Site host. Waystone never reads database
        files, credentials, or vector stores.
      </p>
      <div className="ws-actions">
        {kinds.map((kind) => (
          <button key={kind} type="button" onClick={() => void start(kind)}>
            Start {kind}
          </button>
        ))}
      </div>
      <ErrorAlert error={error} />
      {operations.map((operation) => (
        <HostOperationProgress key={operation.id} operation={operation} />
      ))}
    </section>
  );
}
