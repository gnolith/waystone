import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import {
  entityLabel,
  formatSnakValue,
  formatTimestamp,
  safeExternalUrl,
} from './formatting.js';
import { publicErrorMessage } from './errors.js';
import type {
  AsyncStateProps,
  EntityRevisionMetadata,
  EntitySearchHit,
  SparqlQueryResult,
  StatementRank,
  WaystoneCapabilities,
  WaystoneReference,
  WaystoneSessionDisplay,
  WaystoneSnak,
  WaystoneStatement,
  WikibaseEntity,
} from './model.js';

export interface WaystoneLinkProps extends ComponentPropsWithoutRef<'a'> {
  external?: boolean;
}
export function WaystoneLink({
  external,
  children,
  ...props
}: WaystoneLinkProps) {
  return (
    <a
      {...props}
      rel={external ? 'noopener noreferrer' : props.rel}
      target={external ? '_blank' : props.target}
    >
      {children}
    </a>
  );
}

export function WaystoneSkipLink({
  href = '#waystone-main',
}: {
  href?: string;
}) {
  return (
    <a className="ws-skip-link" href={href}>
      Skip to main content
    </a>
  );
}

export interface WaystoneNavigationItem {
  id: string;
  label: string;
  href: string;
}
export function WaystoneNavigation({
  items,
  currentPath,
  label = 'Main navigation',
}: {
  items: readonly WaystoneNavigationItem[];
  currentPath?: string;
  label?: string;
}) {
  return (
    <nav className="ws-nav" aria-label={label}>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              aria-current={currentPath === item.href ? 'page' : undefined}
              data-waystone-navigation-id={item.id}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function WaystoneHeader({
  title,
  subtitle,
  navigation,
  session,
}: {
  title: string;
  subtitle?: string;
  navigation?: ReactNode;
  session?: WaystoneSessionDisplay;
}) {
  return (
    <header className="ws-header">
      <div className="ws-header__brand">
        <a href="/" className="ws-wordmark">
          {title}
        </a>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {navigation}
      <div className="ws-session" aria-label="Current user">
        {session?.displayName ?? 'Guest'}
      </div>
    </header>
  );
}
export function WaystoneMain({
  children,
  ...props
}: ComponentPropsWithoutRef<'main'>) {
  return (
    <main id="waystone-main" className="ws-main" {...props}>
      {children}
    </main>
  );
}
export function WaystoneFooter({
  children = 'Powered by Gnolith',
}: {
  children?: ReactNode;
}) {
  return <footer className="ws-footer">{children}</footer>;
}
export function WaystoneCommandArea({ children }: { children?: ReactNode }) {
  return (
    <aside className="ws-command-area" aria-label="Page actions">
      {children}
    </aside>
  );
}
export function WaystoneBreadcrumbs({
  items,
}: {
  items: readonly { label: string; href?: string }[];
}) {
  return (
    <nav className="ws-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href && index < items.length - 1 ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function WaystoneShell({
  title,
  subtitle,
  navigation = [],
  currentPath,
  session,
  commandArea,
  children,
  footer,
  navigationSlot,
}: {
  title: string;
  subtitle?: string;
  navigation?: readonly WaystoneNavigationItem[];
  currentPath?: string;
  session?: WaystoneSessionDisplay;
  commandArea?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  navigationSlot?: ReactNode;
}) {
  return (
    <div className="ws-shell">
      <WaystoneSkipLink />
      <WaystoneHeader
        title={title}
        {...(subtitle ? { subtitle } : {})}
        {...(session ? { session } : {})}
        navigation={
          navigationSlot ?? (
            <WaystoneNavigation
              items={navigation}
              {...(currentPath ? { currentPath } : {})}
            />
          )
        }
      />
      <div className="ws-shell__body">
        {commandArea && (
          <WaystoneCommandArea>{commandArea}</WaystoneCommandArea>
        )}
        <WaystoneMain>{children}</WaystoneMain>
      </div>
      <WaystoneFooter>{footer}</WaystoneFooter>
    </div>
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="ws-status" role="status" aria-live="polite">
      <span className="ws-spinner" aria-hidden="true" />
      {label}…
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="ws-empty">
      <h2>{title}</h2>
      {children && <div>{children}</div>}
      {action && <div className="ws-actions">{action}</div>}
    </section>
  );
}
export function PermissionDenied({
  children = 'You do not have permission to view or change this information.',
}: {
  children?: ReactNode;
}) {
  return (
    <div className="ws-alert ws-alert--warning" role="alert">
      <strong>Permission denied</strong>
      <p>{children}</p>
    </div>
  );
}
export function NetworkError({ retry }: { retry?: ReactNode }) {
  return (
    <div className="ws-alert ws-alert--danger" role="alert">
      <strong>Connection problem</strong>
      <p>The Site could not be reached. Check your connection and try again.</p>
      {retry}
    </div>
  );
}
export function WaystoneErrorDisplay({
  error,
  title = 'Unable to complete this request',
}: {
  error: unknown;
  title?: string;
}) {
  return (
    <div className="ws-alert ws-alert--danger" role="alert">
      <strong>{title}</strong>
      <p>{publicErrorMessage(error)}</p>
    </div>
  );
}
export function AsyncState({
  loading,
  error,
  permissionDenied,
  children,
}: AsyncStateProps) {
  if (loading) return <LoadingState />;
  if (permissionDenied) return <PermissionDenied />;
  if (error) return <WaystoneErrorDisplay error={error} />;
  return <>{children}</>;
}

export function EntityLabel({
  entity,
  language = 'en',
}: {
  entity: Pick<WikibaseEntity, 'id' | 'labels'>;
  language?: string;
}) {
  return <span>{entityLabel(entity, language)}</span>;
}
export function EntityDescription({
  entity,
  language = 'en',
}: {
  entity: Pick<WikibaseEntity, 'descriptions'>;
  language?: string;
}) {
  const text =
    entity.descriptions[language] ??
    Object.values(entity.descriptions).find(Boolean);
  return text ? (
    <p className="ws-description">{text}</p>
  ) : (
    <p className="ws-muted">No description</p>
  );
}
export function EntityLink({
  id,
  label,
  basePath,
}: {
  id: string;
  label?: string;
  basePath?: string;
}) {
  const root = basePath ?? (id.startsWith('P') ? '/properties' : '/entities');
  return (
    <a className="ws-entity-link" href={`${root}/${encodeURIComponent(id)}`}>
      <span>{label ?? id}</span>
      {label && <span className="ws-id">{id}</span>}
    </a>
  );
}
export function AliasList({
  aliases,
  language = 'en',
}: {
  aliases: WikibaseEntity['aliases'];
  language?: string;
}) {
  const values = aliases[language] ?? [];
  return (
    <div>
      <h2>Aliases</h2>
      {values.length ? (
        <ul className="ws-inline-list">
          {values.map((alias) => (
            <li key={alias}>{alias}</li>
          ))}
        </ul>
      ) : (
        <p className="ws-muted">No aliases</p>
      )}
    </div>
  );
}
export function SitelinkList({
  sitelinks = {},
}: {
  sitelinks?: WikibaseEntity['sitelinks'];
}) {
  const entries = Object.entries(sitelinks);
  return (
    <div>
      <h2>Sitelinks</h2>
      {entries.length ? (
        <ul>
          {entries.map(([site, value]) => (
            <li key={site}>
              {value.url ? (
                <WaystoneLink href={value.url} external>
                  {value.title}
                </WaystoneLink>
              ) : (
                value.title
              )}
              <span className="ws-id">{site}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ws-muted">No sitelinks</p>
      )}
    </div>
  );
}
export function EntityMetadata({ entity }: { entity: WikibaseEntity }) {
  return (
    <dl className="ws-metadata">
      <div>
        <dt>Entity ID</dt>
        <dd>{entity.id}</dd>
      </div>
      <div>
        <dt>Type</dt>
        <dd>{entity.type}</dd>
      </div>
      {entity.datatype && (
        <div>
          <dt>Datatype</dt>
          <dd>{entity.datatype}</dd>
        </div>
      )}
      <div>
        <dt>Revision</dt>
        <dd>{entity.revision}</dd>
      </div>
      <div>
        <dt>Last modified</dt>
        <dd>
          <time dateTime={entity.modified}>
            {formatTimestamp(entity.modified)}
          </time>
        </dd>
      </div>
    </dl>
  );
}

const rankLabels: Record<StatementRank, string> = {
  preferred: 'Preferred rank',
  normal: 'Normal rank',
  deprecated: 'Deprecated rank',
};
export function RankBadge({ rank }: { rank: StatementRank }) {
  return (
    <span className={`ws-rank ws-rank--${rank}`} aria-label={rankLabels[rank]}>
      {rank}
    </span>
  );
}
export function SnakValue({ snak }: { snak: WaystoneSnak }) {
  const value = formatSnakValue(snak);
  const isEntity =
    snak.snaktype === 'value' &&
    typeof snak.datavalue === 'string' &&
    (snak.datatype === 'wikibase-item' ||
      snak.datatype === 'wikibase-property');
  const safeUrl =
    snak.snaktype === 'value' &&
    snak.datatype === 'url' &&
    typeof snak.datavalue === 'string'
      ? safeExternalUrl(snak.datavalue)
      : undefined;
  return (
    <span
      className={`ws-snak ws-snak--${snak.snaktype}`}
      aria-label={`Snak type: ${snak.snaktype}`}
    >
      {isEntity ? (
        <EntityLink id={snak.datavalue as string} />
      ) : safeUrl ? (
        <WaystoneLink href={safeUrl} external>
          {value}
        </WaystoneLink>
      ) : (
        value
      )}
      <span className="ws-sr-only">, datatype {snak.datatype}</span>
    </span>
  );
}
export function QualifierList({
  qualifiers = {},
}: {
  qualifiers?: Record<string, WaystoneSnak[]>;
}) {
  const groups = Object.entries(qualifiers);
  if (!groups.length) return null;
  return (
    <div className="ws-subvalues">
      <h4>Qualifiers</h4>
      <dl>
        {groups.map(([property, snaks]) => (
          <div key={property}>
            <dt>
              <EntityLink id={property} />
            </dt>
            <dd>
              {snaks.map((snak, i) => (
                <SnakValue key={`${property}-${i}`} snak={snak} />
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
export function ReferenceList({
  references = [],
}: {
  references?: WaystoneReference[];
}) {
  if (!references.length) return null;
  return (
    <div className="ws-subvalues">
      <h4>References</h4>
      <ol>
        {references.map((reference, i) => (
          <li key={reference.hash ?? i}>
            <dl>
              {Object.entries(reference.snaks).map(([property, snaks]) => (
                <div key={property}>
                  <dt>
                    <EntityLink id={property} />
                  </dt>
                  <dd>
                    {snaks.map((snak, j) => (
                      <SnakValue key={`${property}-${j}`} snak={snak} />
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
export function Statement({ statement }: { statement: WaystoneStatement }) {
  return (
    <article
      className={`ws-statement ws-statement--${statement.rank}`}
      aria-labelledby={`statement-${statement.id}`}
    >
      <header>
        <span id={`statement-${statement.id}`} className="ws-id">
          Statement {statement.id}
        </span>
        <RankBadge rank={statement.rank} />
      </header>
      <div className="ws-statement__value">
        <SnakValue snak={statement.mainsnak} />
      </div>
      <QualifierList qualifiers={statement.qualifiers ?? {}} />
      <ReferenceList references={statement.references ?? []} />
    </article>
  );
}
export function StatementGroup({
  property,
  statements,
}: {
  property: string;
  statements: readonly WaystoneStatement[];
}) {
  return (
    <section className="ws-statement-group">
      <h3>
        <EntityLink id={property} />
      </h3>
      <div>
        {statements.map((statement) => (
          <Statement key={statement.id} statement={statement} />
        ))}
      </div>
    </section>
  );
}
export function StatementGroups({
  statements,
}: {
  statements: WikibaseEntity['statements'];
}) {
  const groups = Object.entries(statements);
  return (
    <section aria-labelledby="statements-title">
      <h2 id="statements-title">Statements</h2>
      {groups.length ? (
        groups.map(([property, values]) => (
          <StatementGroup
            key={property}
            property={property}
            statements={values}
          />
        ))
      ) : (
        <p className="ws-muted">No statements</p>
      )}
    </section>
  );
}

export function EntitySummary({
  entity,
  language = 'en',
}: {
  entity: WikibaseEntity;
  language?: string;
}) {
  return (
    <header className="ws-entity-heading">
      <p className="ws-eyebrow">
        {entity.type === 'property' ? 'Property' : 'Item'} · {entity.id}
      </p>
      <h1>
        <EntityLabel entity={entity} language={language} />
      </h1>
      <EntityDescription entity={entity} language={language} />
      {entity.redirect && (
        <div className="ws-alert" role="status">
          Redirects to <EntityLink id={entity.redirect} />
        </div>
      )}
      {entity.deleted && (
        <div className="ws-alert ws-alert--warning" role="status">
          This entity is deleted.
        </div>
      )}
    </header>
  );
}
export function EntityPage({
  entity,
  language = 'en',
  actions,
  panels,
}: {
  entity: WikibaseEntity;
  language?: string;
  actions?: ReactNode;
  panels?: ReactNode;
}) {
  return (
    <article>
      <EntitySummary entity={entity} language={language} />
      {actions && <WaystoneCommandArea>{actions}</WaystoneCommandArea>}
      <div className="ws-entity-layout">
        <div>
          <StatementGroups statements={entity.statements} />
          {panels}
        </div>
        <aside className="ws-entity-aside">
          <EntityMetadata entity={entity} />
          <AliasList aliases={entity.aliases} language={language} />
          <SitelinkList sitelinks={entity.sitelinks} />
        </aside>
      </div>
    </article>
  );
}
export function PropertyPage(props: Parameters<typeof EntityPage>[0]) {
  return <EntityPage {...props} />;
}

export function EntitySearchResults({
  results,
  activeIndex,
  next,
}: {
  results: readonly EntitySearchHit[];
  activeIndex?: number;
  next?: ReactNode;
}) {
  return (
    <div>
      <ul
        className="ws-search-results"
        role="listbox"
        aria-label="Entity search results"
      >
        {results.map((result, index) => (
          <li
            key={result.id}
            role="option"
            aria-selected={activeIndex === index}
          >
            <EntityLink
              id={result.id}
              {...(result.label ? { label: result.label } : {})}
            />
            <span className="ws-type">{result.type}</span>
            {result.description && <p>{result.description}</p>}
          </li>
        ))}
      </ul>
      {next}
    </div>
  );
}

export function RecentlyViewedEntities({
  entities,
}: {
  entities: readonly Pick<WikibaseEntity, 'id' | 'labels' | 'type'>[];
}) {
  return (
    <section aria-labelledby="recently-viewed-title">
      <h2 id="recently-viewed-title">Recently viewed</h2>
      {entities.length ? (
        <ul>
          {entities.map((entity) => (
            <li key={entity.id}>
              <EntityLink id={entity.id} label={entityLabel(entity)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="ws-muted">No recently viewed entities on this device.</p>
      )}
    </section>
  );
}

export function RevisionMetadata({
  revision,
}: {
  revision: EntityRevisionMetadata;
}) {
  return (
    <dl className="ws-revision-meta">
      <div>
        <dt>Revision</dt>
        <dd>{revision.revision}</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>
          <time dateTime={revision.timestamp}>
            {formatTimestamp(revision.timestamp)}
          </time>
        </dd>
      </div>
      {revision.author && (
        <div>
          <dt>Author</dt>
          <dd>{revision.author}</dd>
        </div>
      )}
      {revision.summary && (
        <div>
          <dt>Summary</dt>
          <dd>{revision.summary}</dd>
        </div>
      )}
    </dl>
  );
}
export function RevisionSummary({
  revision,
}: {
  revision: EntityRevisionMetadata;
}) {
  return (
    <article className="ws-revision">
      <h3>Revision {revision.revision}</h3>
      <RevisionMetadata revision={revision} />
    </article>
  );
}
export function RevisionList({
  revisions,
}: {
  revisions: readonly EntityRevisionMetadata[];
}) {
  return (
    <section>
      <h2>Revision history</h2>
      {revisions.length ? (
        <ol className="ws-revision-list">
          {revisions.map((revision) => (
            <li key={revision.revision}>
              <RevisionSummary revision={revision} />
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="No revisions">
          <p>No revision history is available.</p>
        </EmptyState>
      )}
    </section>
  );
}
export function RevisionViewer({ entity }: { entity: WikibaseEntity }) {
  return (
    <section>
      <h2>Historical revision {entity.revision}</h2>
      <EntityPage entity={entity} />
    </section>
  );
}
export function RevisionDiff({
  before,
  after,
}: {
  before: WikibaseEntity;
  after: WikibaseEntity;
}) {
  const left = JSON.stringify(before, null, 2).split('\n');
  const right = JSON.stringify(after, null, 2).split('\n');
  return (
    <section>
      <h2>
        Compare revisions {before.revision} and {after.revision}
      </h2>
      <div className="ws-diff">
        <pre aria-label={`Revision ${before.revision}`}>{left.join('\n')}</pre>
        <pre aria-label={`Revision ${after.revision}`}>{right.join('\n')}</pre>
      </div>
    </section>
  );
}

export function SparqlBindingsTable({
  result,
}: {
  result: Extract<SparqlQueryResult, { kind: 'bindings' }>;
}) {
  return (
    <div className="ws-table-wrap">
      <table>
        <caption>
          SPARQL query bindings{result.truncated ? ' (truncated)' : ''}
        </caption>
        <thead>
          <tr>
            {result.variables.map((variable) => (
              <th key={variable} scope="col">
                {variable}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.bindings.map((binding, index) => (
            <tr key={index}>
              {result.variables.map((variable) => (
                <td key={variable}>
                  {binding[variable]?.value ?? (
                    <span className="ws-muted">unbound</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function SparqlBooleanResult({ value }: { value: boolean }) {
  return (
    <div className="ws-ask" role="status">
      ASK result: <strong>{value ? 'true' : 'false'}</strong>
    </div>
  );
}
export function SparqlResults({ result }: { result: SparqlQueryResult }) {
  return (
    <section aria-labelledby="sparql-results-heading">
      <header className="ws-section-header">
        <h2 id="sparql-results-heading">Results</h2>
        {result.elapsedMs !== undefined && <span>{result.elapsedMs} ms</span>}
      </header>
      {result.kind === 'bindings' ? (
        <SparqlBindingsTable result={result} />
      ) : result.kind === 'boolean' ? (
        <SparqlBooleanResult value={result.value} />
      ) : (
        <pre
          className="ws-rdf-result"
          aria-label={`RDF result, ${result.mediaType}`}
        >
          {result.data}
        </pre>
      )}
    </section>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="ws-field">
      <label>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {hint && <span className="ws-hint">{hint}</span>}
        {children}
      </label>
      {error && (
        <p className="ws-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function CapabilityControl({
  capability,
  capabilities,
  children,
  fallback,
}: {
  capability: keyof WaystoneCapabilities;
  capabilities?: WaystoneCapabilities;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return capabilities?.[capability] ? <>{children}</> : <>{fallback}</>;
}

export function KnowledgeSummary({
  items,
  properties,
  statements,
}: {
  items: number;
  properties: number;
  statements: number;
}) {
  return (
    <section aria-labelledby="knowledge-summary">
      <h2 id="knowledge-summary">Knowledge summary</h2>
      <dl className="ws-metrics">
        <div>
          <dt>Items</dt>
          <dd>{items}</dd>
        </div>
        <div>
          <dt>Properties</dt>
          <dd>{properties}</dd>
        </div>
        <div>
          <dt>Statements</dt>
          <dd>{statements}</dd>
        </div>
      </dl>
    </section>
  );
}
export function RecentChanges({
  revisions,
}: {
  revisions: readonly EntityRevisionMetadata[];
}) {
  return (
    <section>
      <h2>Recent changes</h2>
      <RevisionList revisions={revisions} />
    </section>
  );
}
export function InstalledModuleSummary({
  modules,
}: {
  modules: readonly { id: string; label: string; version?: string }[];
}) {
  return (
    <section>
      <h2>Installed modules</h2>
      <ul className="ws-module-list">
        {modules.map((module) => (
          <li key={module.id}>
            <strong>{module.label}</strong>
            {module.version && <span>{module.version}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
