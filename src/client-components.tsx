'use client';

import {
  Component,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  EmptyState,
  EntityPage,
  EntitySearchResults,
  LoadingState,
  PermissionDenied,
  RevisionList,
  SparqlResults,
  WaystoneErrorDisplay,
} from './components.js';
import type {
  EntityRevisionPage,
  EntitySearchResult,
  SparqlQueryResult,
  SparqlValidationResult,
  WikibaseEntity,
  WorkshopClient,
} from './model.js';
import { callWorkshop, isWorkshopRequestError } from './workshop-client.js';

export class WaystoneErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error?: unknown }
> {
  state: { error?: unknown } = {};

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch() {
    // Hosts may observe React errors outside Waystone. Never log hidden details.
  }

  render() {
    if (this.state.error)
      return (
        this.props.fallback ?? <WaystoneErrorDisplay error={this.state.error} />
      );
    return this.props.children;
  }
}

export function EntitySearch({
  client,
  onSelect,
}: {
  client: WorkshopClient;
  onSelect?: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<EntitySearchResult>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(undefined);
    try {
      setResult(
        await callWorkshop(client, 'search', {
          text: query,
          kinds: ['item'],
        }),
      );
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="entity-search-heading">
      <h2 id="entity-search-heading">Find Items and Properties</h2>
      <form role="search" onSubmit={(event) => void submit(event)}>
        <label>
          Search knowledge
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="submit" disabled={loading || !query.trim()}>
          Search
        </button>
      </form>
      {loading ? <LoadingState label="Searching" /> : null}
      {error ? <WaystoneErrorDisplay error={error} /> : null}
      {result ? (
        result.results.length ? (
          <EntitySearchResults
            results={result.results}
            {...(onSelect ? { onSelect: (hit) => onSelect(hit.id) } : {})}
          />
        ) : (
          <EmptyState title="No matching Items or Properties" />
        )
      ) : null}
    </section>
  );
}

export const QuickEntitySearch = EntitySearch;

export function CreateEntityEditor({
  client,
  onSaved,
}: {
  client: WorkshopClient;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  const [entityType, setEntityType] = useState<'item' | 'property'>('item');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<unknown>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const entity = await callWorkshop<
        {
          idempotencyKey: string;
          authoredText: string;
          data: Readonly<Record<string, unknown>>;
        },
        WikibaseEntity
      >(client, entityType === 'property' ? 'create_property' : 'create_item', {
        idempotencyKey: `create-${entityType}-${crypto.randomUUID()}`,
        authoredText: `Create ${entityType}: ${label}`,
        data: {
          labels: { en: label },
          ...(description ? { descriptions: { en: description } } : {}),
        },
      });
      onSaved?.(entity);
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>Create Item or Property</h2>
      <label>
        Entity type
        <select
          value={entityType}
          onChange={(event) =>
            setEntityType(event.target.value as 'item' | 'property')
          }
        >
          <option value="item">Item</option>
          <option value="property">Property</option>
        </select>
      </label>
      <label>
        Label
        <input
          required
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <button type="submit">Create</button>
      {error ? <WaystoneErrorDisplay error={error} /> : null}
    </form>
  );
}

export function EntityEditor({
  client,
  entity,
  onSaved,
}: {
  client: WorkshopClient;
  entity: WikibaseEntity;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  const [label, setLabel] = useState(entity.labels.en ?? '');
  const [error, setError] = useState<unknown>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const value = await callWorkshop<
        {
          entityId: string;
          expectedRevision: number;
          idempotencyKey: string;
          mutations: readonly {
            kind: 'label';
            authoredText: string;
            value: Readonly<Record<string, unknown>>;
          }[];
        },
        WikibaseEntity
      >(client, 'mutate_entity', {
        entityId: entity.id,
        expectedRevision: entity.revision,
        idempotencyKey: `label-${entity.id}-${entity.revision}`,
        mutations: [
          {
            kind: 'label',
            authoredText: `Set English label to ${label}`,
            value: { language: 'en', value: label },
          },
        ],
      });
      onSaved?.(value);
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>Edit {entity.id}</h2>
      <label>
        English label
        <input
          required
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>
      <button type="submit">Save changes</button>
      {isWorkshopRequestError(error) && error.code === 'conflict' ? (
        <div role="alert" className="ws-alert ws-alert--warning">
          This entity has a newer revision. Refresh before saving again.
        </div>
      ) : error ? (
        <WaystoneErrorDisplay error={error} />
      ) : null}
    </form>
  );
}

export function StatementEditor({
  client,
  entity,
  onSaved,
}: {
  client: WorkshopClient;
  entity: WikibaseEntity;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  const [propertyId, setPropertyId] = useState('P1');
  const [value, setValue] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<unknown>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      onSaved?.(
        await callWorkshop(client, 'mutate_entity', {
          entityId: entity.id,
          expectedRevision: entity.revision,
          idempotencyKey: `statement-${entity.id}-${entity.revision}`,
          mutations: [
            {
              kind: 'statement',
              authoredText: text,
              value: { propertyId, value },
            },
          ],
        }),
      );
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>Add statement</h2>
      <label>
        Property
        <input
          required
          pattern="P[0-9]+"
          value={propertyId}
          onChange={(event) => setPropertyId(event.target.value)}
        />
      </label>
      <label>
        Value
        <input
          required
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <label>
        Revision description
        <textarea
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <button type="submit">Add statement</button>
      {error ? <WaystoneErrorDisplay error={error} /> : null}
    </form>
  );
}

export function SitelinkEditor({
  client,
  entity,
  onSaved,
}: {
  client: WorkshopClient;
  entity: WikibaseEntity;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  const [site, setSite] = useState('');
  const [title, setTitle] = useState('');
  return (
    <form
      className="ws-editor"
      onSubmit={(event) => {
        event.preventDefault();
        void callWorkshop<
          {
            entityId: string;
            expectedRevision: number;
            idempotencyKey: string;
            mutations: readonly {
              kind: 'sitelink';
              authoredText: string;
              value: Readonly<Record<string, unknown>>;
            }[];
          },
          WikibaseEntity
        >(client, 'mutate_entity', {
          entityId: entity.id,
          expectedRevision: entity.revision,
          idempotencyKey: `sitelink-${entity.id}-${entity.revision}`,
          mutations: [
            {
              kind: 'sitelink',
              authoredText: `Set ${site} sitelink to ${title}`,
              value: { site, title },
            },
          ],
        }).then(onSaved);
      }}
    >
      <h2>Set sitelink</h2>
      <label>
        Site
        <input
          required
          value={site}
          onChange={(event) => setSite(event.target.value)}
        />
      </label>
      <label>
        Title
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <button type="submit">Save sitelink</button>
    </form>
  );
}

export function SparqlStatus({
  state,
  elapsedMs,
}: {
  state: 'idle' | 'validating' | 'running' | 'complete';
  elapsedMs?: number;
}) {
  return (
    <p role="status" aria-live="polite">
      {state === 'idle'
        ? 'Ready'
        : state === 'validating'
          ? 'Validating query'
          : state === 'running'
            ? 'Running query'
            : `Query complete${elapsedMs === undefined ? '' : ` in ${elapsedMs} ms`}`}
    </p>
  );
}

export function SparqlExamples({
  onChoose,
}: {
  onChoose: (query: string) => void;
}) {
  return (
    <div className="ws-actions" aria-label="SPARQL examples">
      <button
        type="button"
        onClick={() => onChoose('SELECT * WHERE { ?s ?p ?o } LIMIT 10')}
      >
        Select sample
      </button>
      <button type="button" onClick={() => onChoose('ASK { ?s ?p ?o }')}>
        ASK sample
      </button>
    </div>
  );
}

export function SparqlPrefixHelper({
  onInsert,
}: {
  onInsert: (prefix: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onInsert('PREFIX wd: <http://www.wikidata.org/entity/>\n')}
    >
      Insert Wikidata prefix
    </button>
  );
}

export function SparqlEditor({ client }: { client: WorkshopClient }) {
  const editorId = useId();
  const [query, setQuery] = useState('SELECT * WHERE { ?s ?p ?o } LIMIT 10');
  const [validation, setValidation] = useState<SparqlValidationResult>();
  const [result, setResult] = useState<SparqlQueryResult>();
  const [error, setError] = useState<unknown>();
  const [state, setState] = useState<
    'idle' | 'validating' | 'running' | 'complete'
  >('idle');
  const controller = useRef<AbortController | null>(null);

  async function run(event: FormEvent) {
    event.preventDefault();
    controller.current?.abort();
    controller.current = new AbortController();
    setError(undefined);
    setResult(undefined);
    setState('validating');
    try {
      const checked = await callWorkshop<
        { query: string },
        SparqlValidationResult
      >(
        client,
        'validate_sparql',
        { query },
        { signal: controller.current.signal },
      );
      setValidation(checked);
      if (!checked.valid) {
        setState('idle');
        return;
      }
      setState('running');
      const nextResult = await callWorkshop<
        { query: string },
        SparqlQueryResult
      >(
        client,
        'query_sparql',
        { query },
        { signal: controller.current.signal },
      );
      setResult(nextResult);
      setState('complete');
    } catch (cause) {
      setError(cause);
      setState('idle');
    }
  }

  return (
    <section aria-labelledby={`${editorId}-heading`}>
      <h2 id={`${editorId}-heading`}>Read-only SPARQL workspace</h2>
      <SparqlExamples onChoose={setQuery} />
      <SparqlPrefixHelper
        onInsert={(prefix) => setQuery((current) => `${prefix}${current}`)}
      />
      <form onSubmit={(event) => void run(event)}>
        <label htmlFor={`${editorId}-query`}>SPARQL query</label>
        <textarea
          id={`${editorId}-query`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="submit"
          disabled={state !== 'idle' && state !== 'complete'}
        >
          Run query
        </button>
        <button type="button" onClick={() => controller.current?.abort()}>
          Cancel
        </button>
      </form>
      <SparqlStatus
        state={state}
        {...(result?.elapsedMs === undefined
          ? {}
          : { elapsedMs: result.elapsedMs })}
      />
      {validation && !validation.valid ? (
        <div role="alert">
          {validation.issues.map((issue) => (
            <p key={`${issue.line ?? 0}:${issue.column ?? 0}:${issue.message}`}>
              {issue.message}
            </p>
          ))}
        </div>
      ) : null}
      {error ? <WaystoneErrorDisplay error={error} /> : null}
      {result ? <SparqlResults result={result} /> : null}
    </section>
  );
}

export function EntityWorkspace({
  client,
  entity,
  revisions,
}: {
  client: WorkshopClient;
  entity: WikibaseEntity;
  revisions?: EntityRevisionPage;
}) {
  return (
    <>
      <EntityPage entity={entity} />
      <EntityEditor client={client} entity={entity} />
      <StatementEditor client={client} entity={entity} />
      {revisions ? <RevisionList revisions={revisions.revisions} /> : null}
    </>
  );
}

export function EntityBrowser({ client }: { client: WorkshopClient }) {
  const [id, setId] = useState('');
  const [entity, setEntity] = useState<WikibaseEntity>();
  const [revisions, setRevisions] = useState<EntityRevisionPage>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  async function open(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const [value, history] = await Promise.all([
        callWorkshop<{ entityId: string }, WikibaseEntity>(
          client,
          'get_entity',
          { entityId: id },
        ),
        callWorkshop<{ entityId: string }, EntityRevisionPage>(
          client,
          'entity_history',
          { entityId: id },
        ),
      ]);
      setEntity(value);
      setRevisions(history);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="entity-browser-heading">
      <h1 id="entity-browser-heading">Items and Properties</h1>
      <form onSubmit={(event) => void open(event)}>
        <label>
          Entity ID
          <input
            required
            value={id}
            onChange={(event) => setId(event.target.value)}
          />
        </label>
        <button type="submit">Open Entity</button>
      </form>
      {loading ? <LoadingState /> : null}
      {error ? <WaystoneErrorDisplay error={error} /> : null}
      {entity ? (
        <EntityWorkspace
          client={client}
          entity={entity}
          {...(revisions ? { revisions } : {})}
        />
      ) : null}
    </section>
  );
}

export const SparqlError = WaystoneErrorDisplay;
export { PermissionDenied };
