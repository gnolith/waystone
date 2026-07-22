import type { ReactNode } from 'react';
import { safeExternalUrl } from './formatting.js';
import type {
  TaprootAnnotation,
  ContentRevisionMetadata,
  ContentSelector,
  HostOperation,
  WorkshopPrompt,
  TaprootResource,
  SearchHealth,
  UnifiedSearchPage,
  UnifiedSearchResult,
} from './model.js';

const MAX_SNIPPET = 600;

export function redactDiagnosticText(value: string): string {
  return value
    .replace(
      /\b(authorization|api[-_ ]?key|access[-_ ]?token|password|secret)\b\s*[:=]\s*[^\s,;]+/gi,
      '$1=[redacted]',
    )
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+/gi, 'Bearer [redacted]');
}

export function canonicalSearchResultHref(result: UnifiedSearchResult): string {
  const sourceId = result.canonicalId;
  switch (result.kind) {
    case 'statement':
      return `/entities/${encodeURIComponent(result.itemId ?? sourceId)}#statement-${encodeURIComponent(result.statementId ?? sourceId)}`;
    case 'item':
      return `/entities/${encodeURIComponent(result.itemId ?? sourceId)}`;
    case 'task':
      return `/tasks/${encodeURIComponent(result.taskId ?? sourceId)}`;
    case 'memory':
      return `/memories/${encodeURIComponent(result.memoryId ?? sourceId)}`;
    case 'prompt':
      return `/prompts/${encodeURIComponent(result.promptId ?? sourceId)}`;
    case 'resource':
      return `/resources/${encodeURIComponent(result.resourceId ?? sourceId)}`;
    case 'annotation':
      return `/annotations/${encodeURIComponent(result.annotationId ?? sourceId)}`;
  }
}

function selectorText(selector: ContentSelector): string {
  if (selector.type === 'text-quote' && 'exact' in selector)
    return `Text quote: ${selector.exact}`;
  if (selector.type === 'text-position' && 'start' in selector)
    return `Text positions ${selector.start}–${selector.end}`;
  if ('value' in selector && selector.value)
    return `${selector.type}: ${selector.value}`;
  return selector.type;
}

export function SelectorDisplay({ selector }: { selector?: ContentSelector }) {
  return selector ? <span>{selectorText(selector)}</span> : <span>None</span>;
}

function resultTitle(result: UnifiedSearchResult): string {
  if ('title' in result && result.title) return result.title;
  if (result.kind === 'item' && result.label) return result.label;
  return result.canonicalId;
}

export function UnifiedSearchResultCard({
  result,
  onNavigate,
}: {
  result: UnifiedSearchResult;
  onNavigate?: (result: UnifiedSearchResult, href: string) => void;
}) {
  const href = canonicalSearchResultHref(result);
  const snippet = result.snippet?.slice(0, MAX_SNIPPET);
  return (
    <article className="ws-search-card" data-search-kind={result.kind}>
      <header>
        <span className="ws-rank">{result.kind}</span>{' '}
        <a
          href={href}
          onClick={() => onNavigate?.(result, href)}
          data-canonical-id={result.canonicalId}
        >
          {resultTitle(result)}
        </a>
      </header>
      <dl className="ws-result-meta">
        <div>
          <dt>Identity</dt>
          <dd>{result.canonicalId}</dd>
        </div>
        <div>
          <dt>Revision</dt>
          <dd>{result.revision}</dd>
        </div>
        <div>
          <dt>Ordering score</dt>
          <dd>{result.score}</dd>
        </div>
        {result.language && (
          <div>
            <dt>Language</dt>
            <dd>{result.language}</dd>
          </div>
        )}
        {'selector' in result && result.selector && (
          <div>
            <dt>Selector</dt>
            <dd>
              <SelectorDisplay selector={result.selector} />
            </dd>
          </div>
        )}
      </dl>
      {snippet && <p className="ws-search-card__snippet">{snippet}</p>}
      {result.contributingStatementIds?.length ? (
        <p className="ws-hint">
          Contributing statements: {result.contributingStatementIds.join(', ')}
        </p>
      ) : null}
    </article>
  );
}

export function UnifiedSearchResults({
  page,
  onNavigate,
}: {
  page: UnifiedSearchPage;
  onNavigate?: (result: UnifiedSearchResult, href: string) => void;
}) {
  return (
    <section aria-labelledby="waystone-search-results-title">
      <div
        className={`ws-alert ${page.degraded ? 'ws-alert--warning' : 'ws-alert--success'}`}
        role="status"
      >
        <strong>
          {page.readiness === 'semantic-augmented'
            ? 'Semantic-augmented search'
            : 'Lexical-only search'}
        </strong>
        {page.notice && <p>{page.notice}</p>}
      </div>
      <h2 id="waystone-search-results-title">Search results</h2>
      {page.results.length === 0 ? (
        <p>No results match this query and its selected filters.</p>
      ) : (
        <ol className="ws-unified-results">
          {page.results.map((result, index) => (
            <li
              key={`${result.kind}:${result.canonicalId}:${result.revision}:${index}`}
            >
              <UnifiedSearchResultCard
                result={result}
                {...(onNavigate ? { onNavigate } : {})}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Definition({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  if (children === undefined || children === null || children === '')
    return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ContentHistory({
  revisions,
}: {
  revisions: readonly ContentRevisionMetadata[];
}) {
  return (
    <section>
      <h2>History</h2>
      {revisions.length ? (
        <ol className="ws-revision-list">
          {revisions.map((revision) => (
            <li className="ws-revision" key={revision.revision}>
              <strong>Revision {revision.revision}</strong>
              <p>
                {revision.timestamp}
                {revision.author ? ` by ${revision.author}` : ''}
              </p>
              {revision.summary && <p>{revision.summary}</p>}
            </li>
          ))}
        </ol>
      ) : (
        <p>No revision history is available.</p>
      )}
    </section>
  );
}

export function ResourceView({ resource }: { resource: TaprootResource }) {
  const externalLocation =
    resource.payload.kind === 'location'
      ? safeExternalUrl(resource.payload.location)
      : undefined;
  return (
    <article className="ws-content-view">
      <header>
        <p className="ws-eyebrow">Resource</p>
        <h1>
          {resource.title ?? resource.id}{' '}
          <span className="ws-id">{resource.id}</span>
        </h1>
      </header>
      <dl className="ws-metadata">
        <Definition label="Revision">{resource.revision}</Definition>
        <Definition label="Language">{resource.language}</Definition>
        <Definition label="Media type">{resource.mediaType}</Definition>
        <Definition label="Integrity">
          {resource.integrity.algorithm}:{resource.integrity.digest} (
          {resource.integrity.byteLength} bytes)
        </Definition>
        <Definition label="Location">
          {externalLocation ? (
            <a
              href={externalLocation}
              rel="noopener noreferrer"
              target="_blank"
            >
              {resource.payload.kind === 'location'
                ? resource.payload.location
                : undefined}
            </a>
          ) : resource.payload.kind === 'location' ? (
            resource.payload.location
          ) : undefined}
        </Definition>
        <Definition label="Linked Items">
          <a href={`/entities/${encodeURIComponent(resource.itemId)}`}>
            Item {resource.itemId}
          </a>
        </Definition>
      </dl>
      {resource.payload.kind === 'inline-text' && (
        <section>
          <h2>Body</h2>
          <pre className="ws-content-body">{resource.payload.text}</pre>
        </section>
      )}
    </article>
  );
}

export function AnnotationView({
  annotation,
}: {
  annotation: TaprootAnnotation;
}) {
  return (
    <article className="ws-content-view">
      <header>
        <p className="ws-eyebrow">Annotation</p>
        <h1>{annotation.id}</h1>
      </header>
      <dl className="ws-metadata">
        <Definition label="Revision">{annotation.revision}</Definition>
        <Definition label="Target">
          <a
            href={`/${annotation.target.kind}s/${encodeURIComponent(annotation.target.sourceId)}`}
          >
            {annotation.target.kind} {annotation.target.sourceId}
          </a>
        </Definition>
        <Definition label="Selector">
          <SelectorDisplay
            {...(annotation.target.selector
              ? { selector: annotation.target.selector }
              : {})}
          />
        </Definition>
        <Definition label="Motivation">{annotation.motivation}</Definition>
        <Definition label="Attribution">
          {annotation.attribution.name ?? annotation.attribution.id}
        </Definition>
        <Definition label="Language">{annotation.language}</Definition>
        <Definition label="Media type">{annotation.mediaType}</Definition>
        <Definition label="Policy revision">
          {annotation.authorization.policyRevision}
        </Definition>
        <Definition label="Body Resource">
          {annotation.body.kind === 'resource' && (
            <a
              href={`/resources/${encodeURIComponent(annotation.body.resourceId)}`}
            >
              Resource {annotation.body.resourceId}
            </a>
          )}
        </Definition>
      </dl>
      {annotation.body.kind === 'text' && (
        <section>
          <h2>Annotation body</h2>
          <p>{annotation.body.text}</p>
        </section>
      )}
    </article>
  );
}

export function PromptView({ prompt }: { prompt: WorkshopPrompt }) {
  return (
    <article className="ws-content-view">
      <header>
        <p className="ws-eyebrow">Prompt</p>
        <h1>
          {prompt.title} <span className="ws-id">{prompt.id}</span>
        </h1>
      </header>
      <dl className="ws-metadata">
        <Definition label="Revision">{prompt.revision}</Definition>
        <Definition label="Language">{prompt.language}</Definition>
        <Definition label="Variables">
          {Object.keys(prompt.variables).join(', ')}
        </Definition>
      </dl>
      <section>
        <h2>Prompt text</h2>
        <pre className="ws-content-body">{prompt.promptText}</pre>
      </section>
    </article>
  );
}

export function SearchHealthView({ health }: { health: SearchHealth }) {
  return (
    <section className="ws-health" aria-labelledby="search-health-title">
      <h2 id="search-health-title">Search status</h2>
      <div
        className={`ws-alert ${health.lexicalReady ? 'ws-alert--success' : 'ws-alert--danger'}`}
        role="status"
      >
        Lexical search is {health.lexicalReady ? 'ready' : 'not ready'};
        semantic search is{' '}
        {health.semanticReady
          ? 'ready'
          : health.semanticConfigured
            ? 'configured but not ready'
            : 'not configured'}
        .
      </div>
      <dl className="ws-metadata">
        <Definition label="Selected configuration">
          {health.selectedConfiguration ?? 'None'}
        </Definition>
        <Definition label="Coverage">
          {health.coverage
            ? `${health.coverage.indexed}${health.coverage.total === undefined ? '' : ` of ${health.coverage.total}`}`
            : 'Unknown'}
        </Definition>
        <Definition label="Pending work">{health.pendingWork ?? 0}</Definition>
      </dl>
      {health.schedules?.length ? (
        <section>
          <h3>Schedules</h3>
          <ul>
            {health.schedules.map((schedule) => (
              <li key={schedule.id}>
                {schedule.id}: {schedule.state}
                {schedule.nextRun ? `; next ${schedule.nextRun}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {health.workers?.length ? (
        <section>
          <h3>Worker progress</h3>
          <ul>
            {health.workers.map((worker) => (
              <li key={worker.worker}>
                {worker.worker}: {worker.completed}
                {worker.total === undefined ? '' : ` of ${worker.total}`} (
                {worker.state})
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {health.failures?.length ? (
        <section>
          <h3>Bounded failures</h3>
          <ul>
            {health.failures.map((failure) => (
              <li key={failure.id}>
                {failure.kind}: {redactDiagnosticText(failure.message)} (
                {failure.attempts} attempts)
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {health.circuits?.length ? (
        <section>
          <h3>Circuits</h3>
          <ul>
            {health.circuits.map((circuit) => (
              <li key={circuit.id}>
                {circuit.id}: {circuit.state}
                {circuit.reason
                  ? ` — ${redactDiagnosticText(circuit.reason)}`
                  : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

export function HostOperationProgress({
  operation,
}: {
  operation: HostOperation;
}) {
  const max = operation.total ?? Math.max(operation.completed ?? 0, 1);
  return (
    <article className="ws-operation">
      <h3>{operation.kind}</h3>
      <p role="status">{operation.state}</p>
      {operation.completed !== undefined && (
        <progress value={operation.completed} max={max}>
          {operation.completed} of {operation.total ?? 'unknown'}
        </progress>
      )}
      {operation.message && <p>{redactDiagnosticText(operation.message)}</p>}
    </article>
  );
}
