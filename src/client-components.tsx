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
  language = 'en',
  onSelect,
}: {
  client: WorkshopClient;
  language?: string;
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
        await callWorkshop(client, 'knowledge.entity.search', {
          text: query,
          language,
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
          entityType: 'item' | 'property';
          label: string;
          description?: string;
          language: string;
        },
        WikibaseEntity
      >(client, 'knowledge.entity.create', {
        entityType,
        label,
        ...(description ? { description } : {}),
        language: 'en',
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
          id: string;
          expectedRevision: number;
          changes: { label: string; language: string };
        },
        WikibaseEntity
      >(client, 'knowledge.entity.update', {
        id: entity.id,
        expectedRevision: entity.revision,
        changes: { label, language: 'en' },
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
        await callWorkshop(client, 'knowledge.statement.add', {
          entityId: entity.id,
          expectedRevision: entity.revision,
          statement: { propertyId, value, text },
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
            site: string;
            title: string;
          },
          WikibaseEntity
        >(client, 'knowledge.sitelink.set', {
          entityId: entity.id,
          expectedRevision: entity.revision,
          site,
          title,
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

export function EntityLifecycleControls({
  client,
  entity,
  onSaved,
}: {
  client: WorkshopClient;
  entity: WikibaseEntity;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  async function remove() {
    if (!window.confirm(`Archive ${entity.id}?`)) return;
    onSaved?.(
      await callWorkshop(client, 'knowledge.entity.archive', {
        id: entity.id,
        expectedRevision: entity.revision,
      }),
    );
  }
  return (
    <div className="ws-actions">
      <button
        type="button"
        className="ws-button--danger"
        onClick={() => void remove()}
      >
        Archive entity
      </button>
    </div>
  );
}

export function RevertRevisionControl({
  client,
  entityId,
  revision,
  expectedRevision,
  onSaved,
}: {
  client: WorkshopClient;
  entityId: string;
  revision: number;
  expectedRevision: number;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        void callWorkshop<
          {
            id: string;
            revision: number;
            expectedRevision: number;
          },
          WikibaseEntity
        >(client, 'knowledge.entity.revert', {
          id: entityId,
          revision,
          expectedRevision,
        }).then(onSaved)
      }
    >
      Revert to revision {revision}
    </button>
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
      const checked = await callWorkshop<string, SparqlValidationResult>(
        client,
        'sparql.validate',
        query,
        { signal: controller.current.signal },
      );
      setValidation(checked);
      if (!checked.valid) {
        setState('idle');
        return;
      }
      setState('running');
      const nextResult = await callWorkshop<string, SparqlQueryResult>(
        client,
        'sparql.query',
        query,
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
        callWorkshop<{ id: string }, WikibaseEntity>(
          client,
          'knowledge.entity.get',
          { id },
        ),
        callWorkshop<{ id: string; limit: number }, EntityRevisionPage>(
          client,
          'knowledge.entity.history',
          { id, limit: 50 },
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
