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
  type TaprootCreateAnnotationInput,
  type TaprootAnnotation,
  type HostOperation,
  type HostOperationKind,
  type WorkshopCreatePromptInput,
  type WorkshopPrompt,
  type TaprootCreateResourceInput,
  type TaprootResource,
  type SearchHealth,
  type SearchKind,
  type SearchPage,
  type SearchRequest,
  type UnifiedSearchInput,
  type UnifiedSearchPage,
  type UnifiedSearchResult,
  type WaystoneClient,
} from './model.js';

export async function hydrateSearchResult(
  client: WaystoneClient,
  result: UnifiedSearchResult,
): Promise<unknown> {
  return client.search.hydrate({
    kind: result.kind,
    sourceId: result.canonicalId,
    sourceRevision: String(result.revision),
    score: result.score,
    snippet: result.snippet ?? '',
  });
}

function canonicalRequest(input: UnifiedSearchInput): SearchRequest {
  const language = input.filters?.language;
  const mediaType = input.filters?.mediaType;
  return {
    text: input.query,
    ...(input.kinds ? { kinds: input.kinds } : {}),
    filters: {
      languages: typeof language === 'string' && language ? [language] : [],
      sourceRevisions: [],
      byKind: {
        ...(typeof mediaType === 'string' && mediaType
          ? { resource: { mediaTypes: [mediaType] } }
          : {}),
      },
    },
    ...(input.pageSize !== undefined ? { limit: input.pageSize } : {}),
    ...(input.cursor ? { cursor: input.cursor } : {}),
  };
}

function displayPage(page: SearchPage): UnifiedSearchPage {
  return {
    results: page.results.map((result) => ({
      kind: result.kind,
      canonicalId: result.sourceId,
      revision: result.sourceRevision,
      score: result.score,
      snippet: result.snippet,
      ...(result.title ? { title: result.title } : {}),
      ...(result.language ? { language: result.language } : {}),
      ...(result.match?.contributingStatementIds
        ? { contributingStatementIds: result.match.contributingStatementIds }
        : {}),
      ...(result.kind === 'item' || result.kind === 'statement'
        ? { itemId: result.sourceId }
        : {}),
      ...(result.kind === 'statement' ? { statementId: result.sourceId } : {}),
      ...(result.kind === 'task' ? { taskId: result.sourceId } : {}),
      ...(result.kind === 'memory' ? { memoryId: result.sourceId } : {}),
      ...(result.kind === 'prompt' ? { promptId: result.sourceId } : {}),
      ...(result.kind === 'resource' ? { resourceId: result.sourceId } : {}),
      ...(result.kind === 'annotation'
        ? { annotationId: result.sourceId }
        : {}),
    })),
    ...(page.cursor ? { nextCursor: page.cursor } : {}),
    readiness: 'lexical-only',
    notice:
      'Search readiness is available through the Workshop administration status response.',
  };
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
      setPage(displayPage(await client.search.query(canonicalRequest(input))));
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
  resource?: TaprootResource;
  onSaved?: (value: TaprootResource) => void;
}) {
  const [title, setTitle] = useState(resource?.title ?? '');
  const [resourceId, setResourceId] = useState(resource?.id ?? '');
  const [itemId, setItemId] = useState<string>(resource?.itemId ?? 'Q1');
  const [body, setBody] = useState(
    resource?.payload.kind === 'inline-text' ? resource.payload.text : '',
  );
  const [location, setLocation] = useState(
    resource?.payload.kind === 'location' ? resource.payload.location : '',
  );
  const [integrity, setIntegrity] = useState(resource?.integrity.digest ?? '');
  const [language, setLanguage] = useState(resource?.language ?? '');
  const [mediaType, setMediaType] = useState(resource?.mediaType ?? '');
  const [selectedExcerpt, setSelectedExcerpt] = useState('');
  const [metadata, setMetadata] = useState('');
  const [linkedItems, setLinkedItems] = useState('');
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
    void parsedMetadata;
    const payload = location
      ? { kind: 'location' as const, location, storage: 'url' as const }
      : { kind: 'inline-text' as const, text: body };
    const input: TaprootCreateResourceInput = {
      id: resourceId,
      itemId: itemId as `Q${number}`,
      ...(title ? { title } : {}),
      payload,
      mediaType,
      ...(language ? { language } : {}),
      integrity: {
        algorithm: 'sha256',
        digest: integrity,
        byteLength:
          resource?.integrity.byteLength ??
          new TextEncoder().encode(body).byteLength,
      },
    };
    try {
      onSaved?.(
        resource
          ? await client.resources.update(
              resource.id,
              {
                ...(title ? { title } : {}),
                payload,
                mediaType,
                ...(language ? { language } : {}),
                integrity: input.integrity,
              },
              {
                expectedRevision: resource.revision,
              },
            )
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
        Resource ID{' '}
        <input
          required
          value={resourceId}
          onChange={(event) => setResourceId(event.target.value)}
        />
      </label>
      <label>
        Linked Item ID{' '}
        <input
          required
          pattern="Q[0-9]+"
          value={itemId}
          onChange={(event) => setItemId(event.target.value)}
        />
      </label>
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
  annotation?: TaprootAnnotation;
  onSaved?: (value: TaprootAnnotation) => void;
}) {
  const [annotationId, setAnnotationId] = useState(annotation?.id ?? '');
  const [body, setBody] = useState(
    annotation?.body.kind === 'text' ? annotation.body.text : '',
  );
  const [bodyResourceId, setBodyResourceId] = useState(
    annotation?.body.kind === 'resource' ? annotation.body.resourceId : '',
  );
  const [targetId, setTargetId] = useState(annotation?.target.sourceId ?? '');
  const [selector, setSelector] = useState(
    annotation?.target.selector &&
      typeof annotation.target.selector.value === 'string'
      ? annotation.target.selector.value
      : '',
  );
  const [motivation, setMotivation] = useState(annotation?.motivation ?? '');
  const [attributedTo, setAttributedTo] = useState(
    annotation?.attribution.name ?? annotation?.attribution.id ?? '',
  );
  const [language, setLanguage] = useState(annotation?.language ?? '');
  const [mediaType, setMediaType] = useState(annotation?.mediaType ?? '');
  const [error, setError] = useState<unknown>();
  async function save(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    const input: TaprootCreateAnnotationInput = {
      id: annotationId,
      body: bodyResourceId
        ? { kind: 'resource', resourceId: bodyResourceId }
        : {
            kind: 'text',
            text: body,
            ...(mediaType ? { mediaType } : {}),
            ...(language ? { language } : {}),
          },
      target: {
        kind: annotation?.target.kind ?? 'resource',
        sourceId: targetId,
        ...(selector
          ? { selector: { type: 'fragment', value: selector } }
          : {}),
      },
      targetVisibility: annotation?.authorization.visibility ?? {
        version: 1,
        clauses: [],
      },
      ...(motivation ? { motivation } : {}),
      ...(annotation?.creator ? { creator: annotation.creator } : {}),
      ...(annotation?.generator ? { generator: annotation.generator } : {}),
      ...(language ? { language } : {}),
      ...(mediaType ? { mediaType } : {}),
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
        Annotation ID{' '}
        <input
          required
          value={annotationId}
          onChange={(event) => setAnnotationId(event.target.value)}
        />
      </label>
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
  prompt?: WorkshopPrompt;
  onSaved?: (value: WorkshopPrompt) => void;
}) {
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [name, setName] = useState(prompt?.name ?? '');
  const [text, setText] = useState(prompt?.promptText ?? '');
  const [language, setLanguage] = useState(prompt?.language ?? '');
  const [variables, setVariables] = useState(
    prompt?.variables ? JSON.stringify(prompt.variables) : '{}',
  );
  const [error, setError] = useState<unknown>();
  async function save(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    let variableSchema: Readonly<Record<string, unknown>>;
    try {
      variableSchema = JSON.parse(variables) as Readonly<
        Record<string, unknown>
      >;
    } catch (cause) {
      setError(cause);
      return;
    }
    const input: WorkshopCreatePromptInput = {
      name,
      ...(title ? { title } : {}),
      promptText: text,
      variables: variableSchema,
      ...(language ? { language } : {}),
      ...(prompt?.scope ? { scope: prompt.scope } : {}),
      ...(prompt?.role ? { role: prompt.role } : {}),
      ...(prompt
        ? {
            active: prompt.active,
            priority: prompt.priority,
            order: prompt.order,
            attribution: prompt.attribution,
            visibility: prompt.visibility,
          }
        : {}),
    };
    try {
      onSaved?.(
        prompt
          ? await client.prompts.update(prompt.id, {
              ...input,
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
        Name{' '}
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
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
        Variable schema (JSON object){' '}
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
  void client;
  return (
    <section>
      <SearchHealthView health={initialHealth} />
      <p>
        Search administration uses exact typed operations through{' '}
        <code>client.search.admin.execute</code>. Configuration identifiers,
        plan identifiers, generations, policies, and limits must be supplied by
        the authorized host; the UI does not invent them.
      </p>
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
