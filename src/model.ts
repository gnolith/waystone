import type { ReactNode } from 'react';
import type {
  TaprootEntityDatatype,
  TaprootEntityId,
  TaprootEntityType,
  TaprootRank,
  TaprootSnakType,
} from './taproot-contracts.js';

export type EntityId = TaprootEntityId;
export type EntityType = TaprootEntityType;
export type SnakType = TaprootSnakType;
export type StatementRank = TaprootRank;
export type WaystoneDatatype = TaprootEntityDatatype | (string & {});

export interface TermMap {
  [language: string]: string | undefined;
}
export interface MonolingualTextValue {
  language: string;
  text: string;
}
export interface TimeValue {
  time: string;
  precision?: number;
  calendarModel?: string;
}
export interface QuantityValue {
  amount: string;
  unit?: string;
  lowerBound?: string;
  upperBound?: string;
}
export interface CoordinateValue {
  latitude: number;
  longitude: number;
  precision?: number;
  globe?: string;
}
export type SnakDataValue =
  | string
  | MonolingualTextValue
  | TimeValue
  | QuantityValue
  | CoordinateValue
  | null;

export interface WaystoneSnak {
  snaktype: SnakType;
  property: EntityId;
  datatype: WaystoneDatatype;
  datavalue?: SnakDataValue;
}

export interface WaystoneReference {
  hash?: string;
  snaks: Record<string, WaystoneSnak[]>;
}
export interface WaystoneStatement {
  id: string;
  /** Authored natural-language description of this exact statement revision. */
  text: string;
  rank: StatementRank;
  mainsnak: WaystoneSnak;
  qualifiers?: Record<string, WaystoneSnak[]>;
  references?: WaystoneReference[];
}

export interface EntityRevisionMetadata {
  revision: number;
  timestamp: string;
  author?: string;
  summary?: string;
}

export interface WikibaseEntity {
  id: EntityId;
  type: EntityType;
  labels: TermMap;
  descriptions: TermMap;
  aliases: Record<string, string[] | undefined>;
  sitelinks?: Record<string, { title: string; url?: string }>;
  datatype?: WaystoneDatatype;
  statements: Record<string, WaystoneStatement[]>;
  revision: number;
  modified: string;
  redirect?: EntityId;
  deleted?: boolean;
}

export interface EntitySearchInput {
  query: string;
  language?: string;
  type?: EntityType;
  cursor?: string;
  limit?: number;
}
export interface EntitySearchHit {
  id: EntityId;
  type: EntityType;
  label?: string;
  description?: string;
  match?: string;
}
export interface EntitySearchResult {
  results: EntitySearchHit[];
  nextCursor?: string;
}
export interface EntityRevisionPage {
  revisions: EntityRevisionMetadata[];
  nextCursor?: string;
}

export interface CreateEntityInput {
  type: EntityType;
  datatype?: WaystoneDatatype;
  language: string;
  label: string;
  description?: string;
}
export type EntityMutationOperation =
  | { op: 'set-label' | 'set-description'; language: string; value: string }
  | { op: 'add-alias' | 'remove-alias'; language: string; value: string }
  | { op: 'set-sitelink'; site: string; title: string }
  | { op: 'remove-sitelink'; site: string }
  | { op: 'add-statement'; statement: WaystoneStatement }
  | {
      op: 'replace-statement';
      statementId: string;
      statement: WaystoneStatement;
    }
  | { op: 'remove-statement'; statementId: string }
  | {
      op: 'set-rank';
      statementId: string;
      rank: StatementRank;
      /** Newly authored text for this exact statement revision. */
      text: string;
    }
  | { op: 'redirect'; target: EntityId }
  | { op: 'soft-delete' }
  | { op: 'revert'; revision: number };
export interface EntityMutationInput {
  operations: EntityMutationOperation[];
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
}
export interface MutationOptions extends RequestOptions {
  expectedRevision: number;
}
export interface SparqlValidationIssue {
  message: string;
  line?: number;
  column?: number;
  code?: string;
}
export interface SparqlValidationResult {
  valid: boolean;
  issues: SparqlValidationIssue[];
  requestId?: string;
}
export type SparqlBindingValue = {
  type: string;
  value: string;
  datatype?: string;
  'xml:lang'?: string;
};
export type SparqlQueryResult =
  | {
      kind: 'bindings';
      variables: string[];
      bindings: Record<string, SparqlBindingValue>[];
      elapsedMs?: number;
      truncated?: boolean;
      requestId?: string;
    }
  | { kind: 'boolean'; value: boolean; elapsedMs?: number; requestId?: string }
  | {
      kind: 'rdf';
      mediaType: string;
      data: string;
      elapsedMs?: number;
      truncated?: boolean;
      requestId?: string;
    };

export interface WaystoneClient {
  entities: {
    search(
      input: EntitySearchInput,
      options?: RequestOptions,
    ): Promise<EntitySearchResult>;
    get(id: string, options?: RequestOptions): Promise<WikibaseEntity>;
    getRevision(
      id: string,
      revision: number,
      options?: RequestOptions,
    ): Promise<WikibaseEntity>;
    listRevisions(
      id: string,
      options?: RequestOptions,
    ): Promise<EntityRevisionPage>;
    create(
      input: CreateEntityInput,
      options?: MutationOptions,
    ): Promise<WikibaseEntity>;
    mutate(
      id: string,
      input: EntityMutationInput,
      options?: MutationOptions,
    ): Promise<WikibaseEntity>;
  };
  sparql: {
    validate(
      query: string,
      options?: RequestOptions,
    ): Promise<SparqlValidationResult>;
    dryRun(query: string, options?: RequestOptions): Promise<SparqlQueryResult>;
    query(query: string, options?: RequestOptions): Promise<SparqlQueryResult>;
  };
  search: {
    query(
      input: UnifiedSearchInput,
      options?: RequestOptions,
    ): Promise<UnifiedSearchPage>;
    health(options?: RequestOptions): Promise<SearchHealth>;
    admin: SearchAdminClient;
  };
  resources: ContentCollection<ResourceRecord, ResourceInput>;
  annotations: ContentCollection<AnnotationRecord, AnnotationInput>;
  prompts: ContentCollection<PromptRecord, PromptInput>;
  tasks: { get(id: string, options?: RequestOptions): Promise<TaskRecord> };
  memories: {
    get(id: string, options?: RequestOptions): Promise<MemoryRecord>;
  };
  hostOperations: {
    list(options?: RequestOptions): Promise<readonly HostOperation[]>;
    start(
      kind: HostOperationKind,
      options?: RequestOptions,
    ): Promise<HostOperation>;
  };
}

export interface WaystoneCapabilities {
  createEntity?: boolean;
  editEntity?: boolean;
  deleteEntity?: boolean;
  revertRevision?: boolean;
  querySparql?: boolean;
  searchAdmin?: boolean;
  editResources?: boolean;
  editAnnotations?: boolean;
  editPrompts?: boolean;
  hostOperations?: boolean;
}
export interface WaystoneSessionDisplay {
  displayName?: string;
  avatarUrl?: string;
  capabilities?: WaystoneCapabilities;
}
export interface NavigationEvent {
  href: string;
  contributionId?: string;
}
export interface MutationResultEvent {
  entityId?: string;
  operation: string;
  ok: boolean;
  requestId?: string;
}
export interface PluginErrorEvent {
  pluginId: string;
  contributionId?: string;
  error: unknown;
}
export interface WaystoneObservability {
  onNavigation?(event: NavigationEvent): void;
  onRequestError?(error: import('./errors.js').WaystoneRequestError): void;
  onMutationResult?(event: MutationResultEvent): void;
  onPluginError?(event: PluginErrorEvent): void;
}

export interface AsyncStateProps {
  loading?: boolean;
  error?: unknown;
  permissionDenied?: boolean;
  children?: ReactNode;
}

/** The single set of independently ranked kinds returned by unified search. */
export const SEARCH_KINDS = [
  'statement',
  'item',
  'task',
  'memory',
  'prompt',
  'resource',
  'annotation',
] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export interface UnifiedSearchFilters {
  language?: string;
  itemId?: string;
  resourceId?: string;
  mediaType?: string;
  motivation?: string;
  selectorType?: string;
}
export interface UnifiedSearchInput {
  query: string;
  kinds?: readonly SearchKind[];
  filters?: UnifiedSearchFilters;
  cursor?: string;
  /** Hosts must enforce their own bound; Waystone sends a value from 1 through 100. */
  pageSize?: number;
}
export interface SearchResultBase {
  kind: SearchKind;
  canonicalId: string;
  revision: number;
  score: number;
  snippet?: string;
  language?: string;
  contributingStatementIds?: readonly string[];
}
export interface StatementSearchResult extends SearchResultBase {
  kind: 'statement';
  statementId: string;
  itemId: string;
}
export interface ItemSearchResult extends SearchResultBase {
  kind: 'item';
  itemId: string;
  label?: string;
}
export interface TaskSearchResult extends SearchResultBase {
  kind: 'task';
  taskId: string;
  title?: string;
}
export interface MemorySearchResult extends SearchResultBase {
  kind: 'memory';
  memoryId: string;
  title?: string;
}
export interface PromptSearchResult extends SearchResultBase {
  kind: 'prompt';
  promptId: string;
  title?: string;
}
export interface ResourceSearchResult extends SearchResultBase {
  kind: 'resource';
  resourceId: string;
  title?: string;
  mediaType?: string;
  selector?: ContentSelector;
}
export interface AnnotationSearchResult extends SearchResultBase {
  kind: 'annotation';
  annotationId: string;
  targetId: string;
  motivation?: string;
  selector?: ContentSelector;
}
export type UnifiedSearchResult =
  | StatementSearchResult
  | ItemSearchResult
  | TaskSearchResult
  | MemorySearchResult
  | PromptSearchResult
  | ResourceSearchResult
  | AnnotationSearchResult;
export type SearchReadinessMode = 'lexical-only' | 'semantic-augmented';
export interface UnifiedSearchPage {
  results: UnifiedSearchResult[];
  nextCursor?: string;
  readiness: SearchReadinessMode;
  degraded?: boolean;
  notice?: string;
}

export type ContentSelector =
  | { type: 'text-quote'; exact: string; prefix?: string; suffix?: string }
  | { type: 'text-position'; start: number; end: number }
  | { type: 'fragment'; value: string }
  | { type: string; value?: string };
export interface ContentRevisionMetadata {
  revision: number;
  timestamp: string;
  author?: string;
  summary?: string;
}
export interface ResourceRecord {
  id: string;
  revision: number;
  title?: string;
  linkedItemIds?: readonly string[];
  metadata?: Readonly<Record<string, string>>;
  integrity?: string;
  location?: string;
  body?: string;
  language?: string;
  mediaType?: string;
  selectedExcerpt?: string;
  modified?: string;
}
export interface ResourceInput {
  title?: string;
  linkedItemIds?: readonly string[];
  metadata?: Readonly<Record<string, string>>;
  integrity?: string;
  location?: string;
  body?: string;
  language?: string;
  mediaType?: string;
  selectedExcerpt?: string;
}
export interface AnnotationBodyResource {
  resourceId: string;
}
export interface AnnotationRecord {
  id: string;
  revision: number;
  body?: string;
  bodyResource?: AnnotationBodyResource;
  targetId: string;
  selector?: ContentSelector;
  motivation?: string;
  attributedTo?: string;
  language?: string;
  mediaType?: string;
  inheritedVisibility?: string;
  modified?: string;
}
export interface AnnotationInput {
  body?: string;
  bodyResource?: AnnotationBodyResource;
  targetId: string;
  selector?: ContentSelector;
  motivation?: string;
  attributedTo?: string;
  language?: string;
  mediaType?: string;
}
export interface PromptRecord {
  id: string;
  revision: number;
  title: string;
  text: string;
  language?: string;
  variables?: readonly string[];
  modified?: string;
}
export interface TaskRecord {
  id: string;
  revision: number;
  title?: string;
}
export interface MemoryRecord {
  id: string;
  revision: number;
  title?: string;
}
export interface PromptInput {
  title: string;
  text: string;
  language?: string;
  variables?: readonly string[];
}
export interface RevisionPage {
  revisions: ContentRevisionMetadata[];
  nextCursor?: string;
}

export interface SearchFailure {
  id: string;
  kind: string;
  message: string;
  attempts: number;
  lastAttempt?: string;
  excluded?: boolean;
}
export interface SearchCircuitStatus {
  id: string;
  state: 'closed' | 'open' | 'half-open';
  reason?: string;
}
export interface SearchWorkerProgress {
  worker: string;
  completed: number;
  total?: number;
  state: string;
}
export interface SearchHealth {
  lexicalReady: boolean;
  semanticConfigured: boolean;
  semanticReady: boolean;
  selectedConfiguration?: string;
  coverage?: { indexed: number; total?: number };
  pendingWork?: number;
  schedules?: readonly { id: string; state: string; nextRun?: string }[];
  failures?: readonly SearchFailure[];
  circuits?: readonly SearchCircuitStatus[];
  workers?: readonly SearchWorkerProgress[];
  adminAuthorized: boolean;
}
export interface BackfillEstimate {
  estimateId: string;
  items: number;
  tokens?: number;
  cost?: { amount: number; currency: string };
  durationSeconds?: number;
  assumptions?: readonly string[];
}
export type SearchRunAction = 'play' | 'resume' | 'pause' | 'stop';
export interface SearchAdminClient {
  estimateBackfill(options?: RequestOptions): Promise<BackfillEstimate>;
  approveBackfill(
    estimateId: string,
    options?: RequestOptions,
  ): Promise<SearchHealth>;
  selectConfiguration(
    id: string,
    options?: RequestOptions,
  ): Promise<SearchHealth>;
  control(
    action: SearchRunAction,
    options?: RequestOptions,
  ): Promise<SearchHealth>;
  retryFailure(id: string, options?: RequestOptions): Promise<SearchHealth>;
  excludeFailure(id: string, options?: RequestOptions): Promise<SearchHealth>;
  reconnectCircuit(id: string, options?: RequestOptions): Promise<SearchHealth>;
  retireConfiguration(
    id: string,
    options?: RequestOptions,
  ): Promise<SearchHealth>;
  deleteEmbeddings(id: string, options?: RequestOptions): Promise<SearchHealth>;
}
export type HostOperationKind = 'snapshot' | 'export' | 'import' | 'restore';
export interface HostOperation {
  id: string;
  kind: HostOperationKind;
  state: 'pending' | 'running' | 'complete' | 'failed';
  completed?: number;
  total?: number;
  message?: string;
}

export interface ContentCollection<TRecord, TInput> {
  get(id: string, options?: RequestOptions): Promise<TRecord>;
  getRevision(
    id: string,
    revision: number,
    options?: RequestOptions,
  ): Promise<TRecord>;
  listRevisions(id: string, options?: RequestOptions): Promise<RevisionPage>;
  create(input: TInput, options?: RequestOptions): Promise<TRecord>;
  update(
    id: string,
    input: TInput,
    options?: MutationOptions,
  ): Promise<TRecord>;
}
