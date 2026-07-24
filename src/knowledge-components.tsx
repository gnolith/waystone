import type { ReactNode } from 'react';
import { EmptyState, PermissionDenied } from './components.js';
import { redactPublicText } from './errors.js';
import type {
  AnnotationViewModel,
  ContentRevisionMetadata,
  ContentSelectorView,
  MemoryViewModel,
  PromptViewModel,
  ReadinessView,
  ResourcePreviewView,
  RevisionView,
  SearchAdministrationView,
  SearchPageView,
  SearchResultView,
  TaskPacketView,
  TaskViewModel,
} from './model.js';

const MAX_TEXT_PREVIEW_BYTES = 64 * 1024;
const SAFE_TEXT_MEDIA_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/json',
  'application/ld+json',
]);

export function redactDiagnosticText(value: string): string {
  return redactPublicText(value);
}

export function ExternalDestination({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return <span>External destination blocked</span>;
  }
  const safe = url.protocol === 'https:' || url.protocol === 'http:';
  if (!safe) return <span>External destination blocked</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer external">
      {children} <span className="ws-visually-hidden">(opens externally)</span>
    </a>
  );
}

export function SelectorDisplay({
  selector,
}: {
  selector?: ContentSelectorView;
}) {
  if (!selector) return null;
  if (selector.type === 'fragment') return <code>#{selector.value}</code>;
  if (selector.type === 'text-position')
    return (
      <span>
        characters {selector.start}–{selector.end}
      </span>
    );
  return <q>{selector.exact}</q>;
}

export function UnifiedSearchResultCard({
  result,
  onOpen,
}: {
  result: SearchResultView;
  onOpen?: (result: SearchResultView) => void;
}) {
  return (
    <article className="ws-search-result">
      <header>
        <span className="ws-kind">{result.kind}</span>
        {result.kind === 'item' ? (
          <span className="ws-kind">
            {result.entityType === 'property' ? 'Property' : 'Item'}
          </span>
        ) : null}
        <code>{result.sourceId}</code>
        <span>ordering signal {result.score.toFixed(3)}</span>
      </header>
      {result.title ? <h3>{result.title}</h3> : null}
      <p>{result.snippet}</p>
      {result.matchLabel ? <p>Matched {result.matchLabel}</p> : null}
      {result.contributingStatementIds?.length ? (
        <details>
          <summary>Traceability</summary>
          <ul>
            {result.contributingStatementIds.map((id) => (
              <li key={id}>
                <code>{id}</code>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {onOpen ? (
        <button type="button" onClick={() => onOpen(result)}>
          Open authorized result
        </button>
      ) : null}
    </article>
  );
}

export function UnifiedSearchResults({
  page,
  onOpen,
  onNext,
}: {
  page: SearchPageView;
  onOpen?: (result: SearchResultView) => void;
  onNext?: (cursor: string) => void;
}) {
  const visible = page.results.filter((result) => !result.hiddenDerivedChunk);
  const hiddenCount = page.results.length - visible.length;
  if (!visible.length)
    return (
      <EmptyState title="No visible results">
        Hidden derived chunks are not canonical objects and are not displayed.
      </EmptyState>
    );
  return (
    <section aria-labelledby="search-results-heading">
      <h2 id="search-results-heading">Search results</h2>
      {page.partial ? (
        <p role="status" className="ws-alert ws-alert--warning">
          Partial results are shown. Some sources are temporarily unavailable.
        </p>
      ) : null}
      {hiddenCount ? (
        <p className="ws-muted">
          {hiddenCount} derived chunk{' '}
          {hiddenCount === 1 ? 'match was' : 'matches were'} omitted because
          chunks are not canonical objects.
        </p>
      ) : null}
      <div className="ws-result-list">
        {visible.map((result) => (
          <UnifiedSearchResultCard
            key={`${result.kind}:${result.sourceId}:${result.sourceRevision}`}
            result={result}
            {...(onOpen ? { onOpen } : {})}
          />
        ))}
      </div>
      {page.cursor && onNext ? (
        <button type="button" onClick={() => onNext(page.cursor!)}>
          Load more results
        </button>
      ) : null}
    </section>
  );
}

export function ContentHistory({
  revisions,
}: {
  revisions: readonly ContentRevisionMetadata[];
}) {
  if (!revisions.length) return <EmptyState title="No revision history" />;
  return (
    <ol className="ws-history">
      {revisions.map((revision) => (
        <li key={revision.revision}>
          <strong>Revision {revision.revision}</strong>{' '}
          <time dateTime={revision.modified}>{revision.modified}</time>
          {revision.actor ? <span> by {revision.actor}</span> : null}
          {revision.summary ? <p>{revision.summary}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function ResourceView({ resource }: { resource: ResourcePreviewView }) {
  const previewAllowed =
    !resource.activeContent &&
    resource.byteLength <= MAX_TEXT_PREVIEW_BYTES &&
    SAFE_TEXT_MEDIA_TYPES.has(resource.mediaType) &&
    typeof resource.text === 'string';
  return (
    <article className="ws-content">
      <header>
        <h2>{resource.title ?? `Resource ${resource.id}`}</h2>
        <code>{resource.id}</code>
      </header>
      <dl className="ws-metadata">
        <div>
          <dt>Linked Item</dt>
          <dd>
            <code>{resource.itemId}</code>
          </dd>
        </div>
        <div>
          <dt>Media type</dt>
          <dd>{resource.mediaType}</dd>
        </div>
        <div>
          <dt>Bytes</dt>
          <dd>{resource.byteLength}</dd>
        </div>
        <div>
          <dt>SHA-256</dt>
          <dd>
            <code>{resource.sha256}</code>
          </dd>
        </div>
      </dl>
      {previewAllowed ? (
        <pre className="ws-resource-preview">{resource.text}</pre>
      ) : (
        <p role="status">
          Preview unavailable: the payload is active, unsupported, or exceeds
          the {MAX_TEXT_PREVIEW_BYTES}-byte text preview limit.
        </p>
      )}
      {resource.externalUrl ? (
        <ExternalDestination href={resource.externalUrl}>
          Open resource source
        </ExternalDestination>
      ) : null}
    </article>
  );
}

export function AnnotationView({
  annotation,
}: {
  annotation: AnnotationViewModel;
}) {
  return (
    <article className="ws-content">
      <header>
        <h2>Annotation {annotation.id}</h2>
        <span>revision {annotation.revision}</span>
      </header>
      {annotation.bodyText ? <p>{annotation.bodyText}</p> : null}
      {annotation.bodyResourceId ? (
        <p>
          Body Resource <code>{annotation.bodyResourceId}</code>
        </p>
      ) : null}
      <p>
        Targets {annotation.targetKind} <code>{annotation.targetId}</code>{' '}
        <SelectorDisplay
          {...(annotation.selector ? { selector: annotation.selector } : {})}
        />
      </p>
      {annotation.motivation ? (
        <p>Motivation: {annotation.motivation}</p>
      ) : null}
    </article>
  );
}

export function PromptView({ prompt }: { prompt: PromptViewModel }) {
  return (
    <article className="ws-content">
      <header>
        <h2>{prompt.title}</h2>
        <code>{prompt.name}</code>
      </header>
      <pre>{prompt.promptText}</pre>
      <p>
        {prompt.active ? 'Active' : 'Inactive'} · revision {prompt.revision}
      </p>
      <details>
        <summary>Variable schema</summary>
        <pre>{JSON.stringify(prompt.variables, null, 2)}</pre>
      </details>
    </article>
  );
}

export function MemoryView({ memory }: { memory: MemoryViewModel }) {
  return (
    <article className="ws-content">
      <h2>{memory.title}</h2>
      <p>{memory.description}</p>
      <pre>{memory.content}</pre>
      <p>
        <code>{memory.slug}</code> · revision {memory.revision}
      </p>
    </article>
  );
}

export function TaskView({ task }: { task: TaskViewModel }) {
  return (
    <article className="ws-content">
      <header>
        <h2>{task.title}</h2>
        <span>{task.state}</span>
      </header>
      <p>{task.description}</p>
      {task.objective ? <p>Objective: {task.objective}</p> : null}
      {task.lease ? (
        <p role={task.lease.expired ? 'alert' : undefined}>
          {task.lease.expired
            ? 'The task lease expired. Refresh before changing ownership.'
            : `Claimed${task.lease.ownerPrincipalId ? ` by ${task.lease.ownerPrincipalId}` : ''}${task.lease.expiresAt ? ` until ${task.lease.expiresAt}` : ''}.`}
        </p>
      ) : null}
      {task.result ? <p>Result: {task.result}</p> : null}
    </article>
  );
}

export function TaskPacketViewComponent({
  packet,
}: {
  packet: TaskPacketView;
}) {
  return (
    <section aria-labelledby="task-packet-heading">
      <h2 id="task-packet-heading">Task packet</h2>
      <TaskView task={packet.task} />
      <h3>Context</h3>
      <ul>
        {packet.context.map((context) => (
          <li key={`${context.label ?? ''}:${context.query}`}>
            {context.label ? <strong>{context.label}</strong> : null}
            <code>{context.query}</code>
            {context.unavailable ? (
              <span>Dependency unavailable</span>
            ) : (
              context.summary
            )}
          </li>
        ))}
      </ul>
      <h3>Memories</h3>
      {packet.memories.map((memory) => (
        <MemoryView key={memory.slug} memory={memory} />
      ))}
    </section>
  );
}

export function RevisionHistory<T>({
  revisions,
  render,
}: {
  revisions: readonly RevisionView<T>[];
  render: (value: T) => ReactNode;
}) {
  return (
    <ol className="ws-history">
      {revisions.map((revision) => (
        <li key={revision.revision}>
          <h3>Revision {revision.revision}</h3>
          <time dateTime={revision.createdAt}>{revision.createdAt}</time>
          {render(revision.value)}
        </li>
      ))}
    </ol>
  );
}

export function ReadinessStatus({ readiness }: { readiness: ReadinessView }) {
  if (!readiness.authenticated)
    return (
      <PermissionDenied>Sign in through the host to continue.</PermissionDenied>
    );
  if (!readiness.authorized)
    return (
      <PermissionDenied>
        Workshop has not authorized this view.
      </PermissionDenied>
    );
  return (
    <section aria-labelledby="readiness-heading">
      <h2 id="readiness-heading">Installation readiness</h2>
      <p role="status" aria-live="polite">
        {readiness.lexicalReady
          ? 'Lexical search is available.'
          : 'Search is currently unavailable.'}{' '}
        {readiness.semanticReady
          ? 'Semantic ranking is available.'
          : readiness.semanticConfigured
            ? `Semantic ranking is degraded${readiness.semanticReason ? `: ${redactDiagnosticText(readiness.semanticReason)}` : '.'} Lexical search may still be used.`
            : 'Semantic ranking is not configured; lexical search may still be used.'}
      </p>
    </section>
  );
}

export function SearchAdministrationStatus({
  status,
}: {
  status: SearchAdministrationView;
}) {
  if (!status.authorized) return <PermissionDenied />;
  return (
    <section aria-labelledby="search-admin-heading">
      <h2 id="search-admin-heading">Search administration</h2>
      <p role="status">State: {status.state}</p>
      {status.selectedConfiguration ? (
        <p>Configuration: {status.selectedConfiguration}</p>
      ) : null}
      {status.failures?.length ? (
        <ul>
          {status.failures.map((failure) => (
            <li key={failure.id}>{redactDiagnosticText(failure.message)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
