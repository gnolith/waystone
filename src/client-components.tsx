'use client';

import {
  Component,
  useEffect,
  useId,
  useRef,
  useState,
  type ErrorInfo,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  EntitySearchResults,
  LoadingState,
  SparqlResults,
  WaystoneErrorDisplay,
} from './components.js';
import { publicErrorMessage, WaystoneRequestError } from './errors.js';
import type {
  CreateEntityInput,
  EntityMutationOperation,
  EntitySearchHit,
  SparqlQueryResult,
  WaystoneClient,
  WaystoneStatement,
  WikibaseEntity,
} from './model.js';

export class WaystoneErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, info: ErrorInfo) => void;
  },
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }
  render() {
    return this.state.error
      ? (this.props.fallback ?? (
          <WaystoneErrorDisplay error={this.state.error} />
        ))
      : this.props.children;
  }
}

export function EntitySearch({
  client,
  language = 'en',
  initialQuery = '',
  onSelect,
}: {
  client: WaystoneClient;
  language?: string;
  initialQuery?: string;
  onSelect?: (hit: EntitySearchHit) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<EntitySearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [nextCursor, setNextCursor] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => controller.current?.abort(), []);
  async function search(cursor?: string) {
    controller.current?.abort();
    controller.current = new AbortController();
    setLoading(true);
    setError(undefined);
    try {
      const page = await client.entities.search(
        { query, language, ...(cursor ? { cursor } : {}) },
        { signal: controller.current.signal },
      );
      setResults((current) =>
        cursor ? [...current, ...page.results] : page.results,
      );
      setNextCursor(page.nextCursor);
      setActive(0);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError'))
        setError(cause);
    } finally {
      setLoading(false);
    }
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      onSelect?.(results[active]);
    }
  }
  return (
    <section className="ws-search" aria-labelledby="entity-search-title">
      <h2 id="entity-search-title">Find knowledge</h2>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <label htmlFor="waystone-entity-search">
          Search by label, description, alias, or ID
        </label>
        <div className="ws-search__input">
          <input
            id="waystone-entity-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            required
          />
          <button type="submit" disabled={loading}>
            Search
          </button>
        </div>
      </form>
      {loading && <LoadingState label="Searching" />}
      {error !== undefined && <WaystoneErrorDisplay error={error} />}
      {!loading && results.length > 0 && (
        <EntitySearchResults
          results={results}
          activeIndex={active}
          next={
            nextCursor && (
              <button type="button" onClick={() => void search(nextCursor)}>
                Load more results
              </button>
            )
          }
        />
      )}
    </section>
  );
}
export const QuickEntitySearch = EntitySearch;

function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    addEventListener('beforeunload', handler);
    return () => removeEventListener('beforeunload', handler);
  }, [dirty]);
}
function FormStatus({
  error,
  success,
}: {
  error?: unknown;
  success?: string | undefined;
}) {
  return (
    <div aria-live="polite">
      {error !== undefined && <WaystoneErrorDisplay error={error} />}
      {success && (
        <p className="ws-alert ws-alert--success" role="status">
          {success}
        </p>
      )}
    </div>
  );
}

export function CreateEntityEditor({
  client,
  language = 'en',
  onCreated,
}: {
  client: WaystoneClient;
  language?: string;
  onCreated?: (entity: WikibaseEntity) => void;
}) {
  const [type, setType] = useState<'item' | 'property'>('item');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [datatype, setDatatype] = useState('string');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  useUnsavedChanges(Boolean(label || description));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!label.trim()) {
      setError(
        new WaystoneRequestError('A label is required.', {
          kind: 'validation',
        }),
      );
      return;
    }
    const input: CreateEntityInput = {
      type,
      language,
      label: label.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(type === 'property' ? { datatype } : {}),
    };
    setBusy(true);
    setError(undefined);
    try {
      onCreated?.(await client.entities.create(input, { expectedRevision: 0 }));
      setLabel('');
      setDescription('');
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>Create entity</h2>
      <label>
        Entity type
        <select
          value={type}
          onChange={(event) =>
            setType(event.target.value as 'item' | 'property')
          }
        >
          <option value="item">Item</option>
          <option value="property">Property</option>
        </select>
      </label>
      {type === 'property' && (
        <label>
          Datatype
          <select
            value={datatype}
            onChange={(event) => setDatatype(event.target.value)}
          >
            <option>string</option>
            <option>wikibase-item</option>
            <option>wikibase-property</option>
            <option>external-id</option>
            <option>url</option>
            <option>commonsMedia</option>
            <option>monolingualtext</option>
            <option>time</option>
            <option>quantity</option>
            <option>globe-coordinate</option>
          </select>
        </label>
      )}
      <label>
        Label
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <FormStatus error={error} />
      <button type="submit" disabled={busy}>
        {busy ? 'Creating…' : `Create ${type}`}
      </button>
    </form>
  );
}

export function EntityEditor({
  client,
  entity,
  language = 'en',
  onSaved,
}: {
  client: WaystoneClient;
  entity: WikibaseEntity;
  language?: string;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  const [label, setLabel] = useState(entity.labels[language] ?? '');
  const [description, setDescription] = useState(
    entity.descriptions[language] ?? '',
  );
  const [aliases, setAliases] = useState(
    (entity.aliases[language] ?? []).join('\n'),
  );
  const [statementJson, setStatementJson] = useState('');
  const [statementText, setStatementText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState<string>();
  const dirty =
    label !== (entity.labels[language] ?? '') ||
    description !== (entity.descriptions[language] ?? '') ||
    aliases !== (entity.aliases[language] ?? []).join('\n') ||
    Boolean(statementJson.trim()) ||
    Boolean(statementText);
  useUnsavedChanges(dirty);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const operations: EntityMutationOperation[] = [];
    if (label !== (entity.labels[language] ?? ''))
      operations.push({ op: 'set-label', language, value: label });
    if (description !== (entity.descriptions[language] ?? ''))
      operations.push({ op: 'set-description', language, value: description });
    const oldAliases = new Set(entity.aliases[language] ?? []);
    const newAliases = new Set(
      aliases
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    );
    for (const value of newAliases)
      if (!oldAliases.has(value))
        operations.push({ op: 'add-alias', language, value });
    for (const value of oldAliases)
      if (!newAliases.has(value))
        operations.push({ op: 'remove-alias', language, value });
    if (statementJson.trim()) {
      if (!statementText.trim()) {
        setError(
          new WaystoneRequestError(
            'Authored statement text is required for this revision.',
            { kind: 'validation' },
          ),
        );
        return;
      }
      try {
        const statement = JSON.parse(statementJson) as WaystoneStatement;
        operations.push({
          op: 'add-statement',
          statement: { ...statement, text: statementText },
        });
      } catch {
        setError(
          new WaystoneRequestError('Statement JSON is not valid.', {
            kind: 'validation',
          }),
        );
        return;
      }
    }
    if (!operations.length) {
      setError(
        new WaystoneRequestError('There are no changes to save.', {
          kind: 'validation',
        }),
      );
      return;
    }
    setBusy(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const saved = await client.entities.mutate(
        entity.id,
        { operations },
        { expectedRevision: entity.revision },
      );
      onSaved?.(saved);
      setStatementJson('');
      setStatementText('');
      setSuccess(`Saved as revision ${saved.revision}.`);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="ws-editor" onSubmit={(event) => void submit(event)}>
      <h2>Edit {entity.id}</h2>
      <label>
        Label
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label>
        Aliases, one per line
        <textarea
          value={aliases}
          onChange={(event) => setAliases(event.target.value)}
        />
      </label>
      <details>
        <summary>Add a complete statement</summary>
        <label>
          Statement JSON
          <textarea
            className="ws-code-input"
            value={statementJson}
            onChange={(event) => setStatementJson(event.target.value)}
            spellCheck={false}
          />
        </label>
        <p className="ws-hint">
          The Site validates property, datatype, qualifiers, references, rank,
          and statement ID.
        </p>
        <label>
          Authored text for this statement revision
          <textarea
            value={statementText}
            onChange={(event) => setStatementText(event.target.value)}
            required={Boolean(statementJson.trim())}
          />
        </label>
        <p className="ws-hint">
          Describe this exact revision. Existing text is never reused
          automatically.
        </p>
      </details>
      <FormStatus error={error} success={success} />
      <button type="submit" disabled={busy || !dirty}>
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

export function StatementEditor({
  client,
  entity,
  onSaved,
}: {
  client: WaystoneClient;
  entity: WikibaseEntity;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  const statements = Object.values(entity.statements).flat();
  const [statementId, setStatementId] = useState(statements[0]?.id ?? '');
  const selected = statements.find((statement) => statement.id === statementId);
  const [draft, setDraft] = useState(
    selected ? JSON.stringify(selected, null, 2) : '',
  );
  const [rank, setRank] = useState(selected?.rank ?? 'normal');
  const [revisionText, setRevisionText] = useState('');
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  useUnsavedChanges(Boolean(draft.trim()));
  function choose(id: string) {
    setStatementId(id);
    const statement = statements.find((value) => value.id === id);
    setDraft(statement ? JSON.stringify(statement, null, 2) : '');
    setRank(statement?.rank ?? 'normal');
    setRevisionText('');
  }
  async function mutate(operation: EntityMutationOperation) {
    setBusy(true);
    setError(undefined);
    try {
      const saved = await client.entities.mutate(
        entity.id,
        { operations: [operation] },
        { expectedRevision: entity.revision },
      );
      onSaved?.(saved);
      if (operation.op !== 'remove-statement') setRevisionText('');
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  function parsedStatement(): WaystoneStatement | undefined {
    if (!revisionText.trim()) {
      setError(
        new WaystoneRequestError(
          'Authored statement text is required for this revision.',
          { kind: 'validation' },
        ),
      );
      return undefined;
    }
    try {
      const statement = JSON.parse(draft) as WaystoneStatement;
      return { ...statement, text: revisionText };
    } catch {
      setError(
        new WaystoneRequestError('Statement JSON is not valid.', {
          kind: 'validation',
        }),
      );
      return undefined;
    }
  }
  return (
    <section className="ws-editor" aria-labelledby="statement-editor-title">
      <h2 id="statement-editor-title">Maintain statements</h2>
      <label>
        Existing statement
        <select
          value={statementId}
          onChange={(event) => choose(event.target.value)}
        >
          <option value="">New statement</option>
          {statements.map((statement) => (
            <option value={statement.id} key={statement.id}>
              {statement.id} · {statement.mainsnak.property}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rank
        <select
          value={rank}
          onChange={(event) =>
            setRank(event.target.value as WaystoneStatement['rank'])
          }
        >
          <option value="preferred">Preferred</option>
          <option value="normal">Normal</option>
          <option value="deprecated">Deprecated</option>
        </select>
      </label>
      <label>
        Statement, including qualifiers and references
        <textarea
          className="ws-code-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          spellCheck={false}
        />
      </label>
      <p className="ws-hint">
        Replacing this document adds or removes qualifiers and references
        exactly as shown. The Site performs protocol validation.
      </p>
      <label>
        Authored text for this statement revision
        <textarea
          value={revisionText}
          onChange={(event) => setRevisionText(event.target.value)}
        />
      </label>
      <p className="ws-hint">
        Required for add, replace, rank, qualifier, and reference changes.
        Existing text is never reused automatically.
      </p>
      <div className="ws-actions">
        <button
          type="button"
          disabled={busy || !draft.trim() || !revisionText.trim()}
          onClick={() => {
            const statement = parsedStatement();
            if (statement)
              void mutate(
                statementId
                  ? { op: 'replace-statement', statementId, statement }
                  : { op: 'add-statement', statement },
              );
          }}
        >
          {statementId ? 'Replace statement' : 'Add statement'}
        </button>
        {statementId && (
          <button
            type="button"
            disabled={busy || !revisionText.trim()}
            onClick={() =>
              void mutate({
                op: 'set-rank',
                statementId,
                rank,
                text: revisionText,
              })
            }
          >
            Change rank
          </button>
        )}
        {statementId && (
          <button
            className="ws-button--danger"
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(`Remove statement ${statementId}?`))
                void mutate({ op: 'remove-statement', statementId });
            }}
          >
            Remove statement
          </button>
        )}
      </div>
      {error !== undefined && <WaystoneErrorDisplay error={error} />}
    </section>
  );
}

export function SitelinkEditor({
  client,
  entity,
  onSaved,
}: {
  client: WaystoneClient;
  entity: WikibaseEntity;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  const [site, setSite] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<unknown>();
  async function mutate(operation: EntityMutationOperation) {
    setError(undefined);
    try {
      onSaved?.(
        await client.entities.mutate(
          entity.id,
          { operations: [operation] },
          { expectedRevision: entity.revision },
        ),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <section className="ws-editor">
      <h2>Maintain sitelinks</h2>
      <label>
        Site key
        <input value={site} onChange={(event) => setSite(event.target.value)} />
      </label>
      <label>
        Page title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <div className="ws-actions">
        <button
          type="button"
          disabled={!site.trim() || !title.trim()}
          onClick={() => void mutate({ op: 'set-sitelink', site, title })}
        >
          Add or replace sitelink
        </button>
        <button
          className="ws-button--danger"
          type="button"
          disabled={!site.trim()}
          onClick={() => {
            if (confirm(`Remove the ${site} sitelink?`))
              void mutate({ op: 'remove-sitelink', site });
          }}
        >
          Remove sitelink
        </button>
      </div>
      {error !== undefined && <WaystoneErrorDisplay error={error} />}
    </section>
  );
}

export function EntityLifecycleControls({
  client,
  entity,
  onSaved,
}: {
  client: WaystoneClient;
  entity: WikibaseEntity;
  onSaved?: (entity: WikibaseEntity) => void;
}) {
  const [target, setTarget] = useState('');
  const [error, setError] = useState<unknown>();
  async function mutate(operation: EntityMutationOperation) {
    setError(undefined);
    try {
      onSaved?.(
        await client.entities.mutate(
          entity.id,
          { operations: [operation] },
          { expectedRevision: entity.revision },
        ),
      );
    } catch (cause) {
      setError(cause);
    }
  }
  return (
    <section className="ws-editor">
      <h2>Entity lifecycle</h2>
      <label>
        Redirect target
        <input
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          pattern="[QP][1-9][0-9]*"
          placeholder="Q42"
        />
      </label>
      <div className="ws-actions">
        <button
          type="button"
          disabled={!/^[QP][1-9][0-9]*$/.test(target)}
          onClick={() => {
            if (confirm(`Redirect ${entity.id} to ${target}?`))
              void mutate({
                op: 'redirect',
                target: target as WikibaseEntity['id'],
              });
          }}
        >
          Redirect entity
        </button>
        <button
          className="ws-button--danger"
          type="button"
          onClick={() => {
            if (
              confirm(`Soft-delete ${entity.id}? This requires a new revision.`)
            )
              void mutate({ op: 'soft-delete' });
          }}
        >
          Soft-delete entity
        </button>
      </div>
      {error !== undefined && <WaystoneErrorDisplay error={error} />}
    </section>
  );
}

export function RevertRevisionControl({
  client,
  entityId,
  currentRevision,
  targetRevision,
  onReverted,
}: {
  client: WaystoneClient;
  entityId: string;
  currentRevision: number;
  targetRevision: number;
  onReverted?: (entity: WikibaseEntity) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  async function revert() {
    if (!confirm(`Revert ${entityId} to revision ${targetRevision}?`)) return;
    setBusy(true);
    setError(undefined);
    try {
      onReverted?.(
        await client.entities.mutate(
          entityId,
          { operations: [{ op: 'revert', revision: targetRevision }] },
          { expectedRevision: currentRevision },
        ),
      );
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="ws-button--danger"
        type="button"
        disabled={busy}
        onClick={() => void revert()}
      >
        {busy ? 'Reverting…' : `Revert to revision ${targetRevision}`}
      </button>
      {error !== undefined && <WaystoneErrorDisplay error={error} />}
    </div>
  );
}

export function SparqlStatus({
  state,
  elapsedMs,
}: {
  state: 'idle' | 'validating' | 'running' | 'aborted' | 'complete';
  elapsedMs?: number | undefined;
}) {
  return (
    <p className="ws-status" role="status" aria-live="polite">
      {state === 'idle'
        ? 'Ready'
        : state === 'complete'
          ? `Complete${elapsedMs === undefined ? '' : ` in ${elapsedMs} ms`}`
          : `${state[0]?.toUpperCase()}${state.slice(1)}…`}
    </p>
  );
}
export function SparqlExamples({
  onChoose,
}: {
  onChoose: (query: string) => void;
}) {
  const examples = [
    {
      label: 'Ten statements',
      query:
        'SELECT ?subject ?predicate ?object WHERE { ?subject ?predicate ?object } LIMIT 10',
    },
    {
      label: 'Does knowledge exist?',
      query: 'ASK { ?subject ?predicate ?object }',
    },
  ];
  return (
    <div className="ws-example-list" aria-label="SPARQL examples">
      {examples.map((example) => (
        <button
          type="button"
          key={example.label}
          onClick={() => onChoose(example.query)}
        >
          {example.label}
        </button>
      ))}
    </div>
  );
}
export function SparqlPrefixHelper({
  onInsert,
}: {
  onInsert: (prefix: string) => void;
}) {
  return (
    <div className="ws-prefixes" aria-label="Common prefixes">
      <button
        type="button"
        onClick={() =>
          onInsert('PREFIX wd: <http://www.wikidata.org/entity/>\n')
        }
      >
        wd:
      </button>
      <button
        type="button"
        onClick={() =>
          onInsert('PREFIX wdt: <http://www.wikidata.org/prop/direct/>\n')
        }
      >
        wdt:
      </button>
      <button
        type="button"
        onClick={() =>
          onInsert('PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n')
        }
      >
        rdfs:
      </button>
    </div>
  );
}
export function SparqlEditor({
  client,
  initialQuery = 'SELECT ?subject ?predicate ?object WHERE { ?subject ?predicate ?object } LIMIT 25',
}: {
  client: WaystoneClient;
  initialQuery?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<SparqlQueryResult>();
  const [error, setError] = useState<unknown>();
  const [state, setState] = useState<
    'idle' | 'validating' | 'running' | 'aborted' | 'complete'
  >('idle');
  const controller = useRef<AbortController | undefined>(undefined);
  async function run(kind: 'validate' | 'dry-run' | 'query') {
    controller.current?.abort();
    controller.current = new AbortController();
    setState(kind === 'validate' ? 'validating' : 'running');
    setError(undefined);
    try {
      if (kind === 'validate') {
        const validation = await client.sparql.validate(query, {
          signal: controller.current.signal,
        });
        if (!validation.valid)
          throw new WaystoneRequestError(
            validation.issues.map((issue) => issue.message).join('; '),
            { kind: 'validation', issues: validation.issues },
          );
        setResult(undefined);
      } else
        setResult(
          await client.sparql[kind === 'dry-run' ? 'dryRun' : 'query'](query, {
            signal: controller.current.signal,
          }),
        );
      setState('complete');
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError')
        setState('aborted');
      else {
        setError(cause);
        setState('idle');
      }
    }
  }
  function download() {
    if (!result) return;
    const data =
      result.kind === 'rdf' ? result.data : JSON.stringify(result, null, 2);
    const url = URL.createObjectURL(
      new Blob([data], {
        type: result.kind === 'rdf' ? result.mediaType : 'application/json',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download =
      result.kind === 'rdf' ? 'query-results.txt' : 'query-results.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="ws-sparql">
      <label htmlFor={id}>
        <h2>SPARQL query</h2>
      </label>
      <SparqlPrefixHelper
        onInsert={(prefix) => setQuery((value) => `${prefix}${value}`)}
      />
      <textarea
        id={id}
        className="ws-sparql__editor"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        spellCheck={false}
      />
      <SparqlExamples onChoose={setQuery} />
      <div className="ws-actions">
        <button type="button" onClick={() => void run('validate')}>
          Validate
        </button>
        <button type="button" onClick={() => void run('dry-run')}>
          Dry run
        </button>
        <button type="button" onClick={() => void run('query')}>
          Run query
        </button>
        {state === 'running' && (
          <button type="button" onClick={() => controller.current?.abort()}>
            Abort
          </button>
        )}
        {result && (
          <>
            <button
              type="button"
              onClick={() =>
                void navigator.clipboard.writeText(
                  result.kind === 'rdf'
                    ? result.data
                    : JSON.stringify(result, null, 2),
                )
              }
            >
              Copy results
            </button>
            <button type="button" onClick={download}>
              Download
            </button>
          </>
        )}
      </div>
      <SparqlStatus state={state} elapsedMs={result?.elapsedMs} />
      {error !== undefined && (
        <div className="ws-alert ws-alert--danger" role="alert">
          <strong>SPARQL error</strong>
          <p>{publicErrorMessage(error)}</p>
        </div>
      )}
      {result && <SparqlResults result={result} />}
    </section>
  );
}
export const SparqlError = WaystoneErrorDisplay;
