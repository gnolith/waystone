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
    query(input: SearchRequest, options?: RequestOptions): Promise<SearchPage>;
    hydrate(
      result: SearchResult,
      options?: RequestOptions,
    ): Promise<SearchHydratedValue>;
    admin: SearchAdministrationClient;
  };
  resources: TaprootResourceCollection;
  annotations: TaprootAnnotationCollection;
  prompts: WorkshopPromptCollection;
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

export interface SearchFilters {
  languages?: readonly string[];
  sourceRevisions?: readonly string[];
  byKind?: Readonly<{
    statement?: { predicateIds: readonly string[] };
    item?: { typeIds: readonly string[] };
    task?: { statuses: readonly string[] };
    resource?: { mediaTypes: readonly string[] };
  }>;
  /** Additional host filters are preserved verbatim. */
  [key: string]: unknown;
}
export interface SearchRequest {
  text: string;
  kinds?: readonly SearchKind[];
  filters?: Record<string, unknown>;
  limit?: number;
  cursor?: string;
}
export type SearchReference =
  | { kind: 'statement'; sourceId: string }
  | { kind: 'item'; sourceId: string }
  | { kind: 'task'; sourceId: string }
  | { kind: 'memory'; sourceId: string }
  | { kind: 'prompt'; sourceId: string }
  | { kind: 'resource'; sourceId: string }
  | { kind: 'annotation'; sourceId: string };
export interface SearchMatch {
  derivedDocumentId?: string;
  selector?: unknown;
  contributingStatementIds?: string[];
}
export interface SearchResult {
  kind: SearchKind;
  sourceId: string;
  sourceRevision: string;
  score: number;
  title?: string;
  snippet: string;
  language?: string;
  match?: SearchMatch;
}
export interface SearchPage {
  results: SearchResult[];
  cursor?: string;
}
/** Presentation input. Use encodeUnifiedSearchInput for the canonical boundary. */
export interface UnifiedSearchInput {
  query: string;
  kinds?: readonly SearchKind[];
  filters?: { language?: string; mediaType?: string; [key: string]: unknown };
  cursor?: string;
  pageSize?: number;
}
export interface UnifiedSearchResult {
  kind: SearchKind;
  canonicalId: string;
  revision: number | string;
  score: number;
  snippet?: string;
  language?: string;
  contributingStatementIds?: readonly string[];
  itemId?: string;
  statementId?: string;
  taskId?: string;
  memoryId?: string;
  promptId?: string;
  resourceId?: string;
  annotationId?: string;
  targetId?: string;
  title?: string;
  label?: string;
  mediaType?: string;
  motivation?: string;
  selector?: ContentSelector;
}
export interface UnifiedSearchPage {
  results: UnifiedSearchResult[];
  nextCursor?: string;
  readiness: 'lexical-only' | 'semantic-augmented';
  degraded?: boolean;
  notice?: string;
}

export type ContentSelector =
  | { type: 'text-quote'; exact: string; prefix?: string; suffix?: string }
  | { type: 'text-position'; start: number; end: number }
  | { type: 'fragment'; value: string }
  | { type: string; value?: string };
export type ActorKind = 'human' | 'agent' | 'import' | 'system';
export interface Attribution {
  id: string;
  kind: ActorKind;
  name?: string;
  organization?: string;
  tool?: string;
  url?: string;
}
export type VisibilityAtom =
  | { kind: 'public' }
  | { kind: 'principal'; principalId: string }
  | { kind: 'workspace'; workspaceId: string }
  | { kind: 'capability'; capability: string };
export interface VisibilityScope {
  version: 1;
  clauses: readonly (readonly VisibilityAtom[])[];
}
export interface ContentAuthorization {
  installationId: string;
  workspaceId: string | null;
  ownerPrincipalId: string;
  policyRevision: number;
  visibility: VisibilityScope;
}
export type ResourcePayload =
  | { kind: 'inline-text'; text: string }
  | {
      kind: 'location';
      location: string;
      storage: 'blob' | 'file' | 'url';
      byteLength?: number;
    };
export interface ResourceIntegrity {
  algorithm: 'sha256';
  digest: string;
  byteLength: number;
}
export interface TaprootResource {
  version: 1;
  id: string;
  itemId: `Q${number}`;
  revision: number;
  title?: string;
  payload: ResourcePayload;
  mediaType: string;
  language?: string;
  integrity: ResourceIntegrity;
  attribution: Attribution;
  authorization: ContentAuthorization;
  createdAt: string;
  modifiedAt: string;
  deletedAt: string | null;
}
export interface TaprootCreateResourceInput {
  id: string;
  itemId: `Q${number}`;
  title?: string;
  payload: ResourcePayload;
  mediaType: string;
  language?: string;
  integrity: ResourceIntegrity;
}
export type AnnotationBody =
  | { kind: 'text'; text: string; mediaType?: string; language?: string }
  | { kind: 'resource'; resourceId: string };
export interface AnnotationSelector {
  type: string;
  [key: string]: unknown;
}
export interface AnnotationTarget {
  kind: SearchKind;
  sourceId: string;
  selector?: AnnotationSelector;
}
export interface TaprootAnnotation {
  version: 1;
  id: string;
  revision: number;
  body: AnnotationBody;
  target: AnnotationTarget;
  motivation?: string;
  creator?: Attribution;
  generator?: Attribution;
  language?: string;
  mediaType?: string;
  attribution: Attribution;
  authorization: ContentAuthorization;
  createdAt: string;
  modifiedAt: string;
  deletedAt: string | null;
}
export interface TaprootCreateAnnotationInput {
  id: string;
  body: AnnotationBody;
  target: AnnotationTarget;
  targetVisibility: VisibilityScope;
  motivation?: string;
  creator?: Attribution;
  generator?: Attribution;
  language?: string;
  mediaType?: string;
}
export interface PromptAttribution {
  source?: string;
  actor?: string;
  note?: string;
}
export interface WorkshopPrompt {
  id: string;
  name: string;
  title: string;
  promptText: string;
  scope?: string;
  role?: string;
  variables: Readonly<Record<string, unknown>>;
  active: boolean;
  priority: number;
  order: number;
  language: string;
  attribution: PromptAttribution;
  revision: number;
  policyRevision: number;
  installationId: string;
  ownerPrincipalId: string;
  workspaceId: string;
  visibility: VisibilityScope;
  authorizationRevision: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt?: string;
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
export interface WorkshopCreatePromptInput {
  id?: string;
  name: string;
  title?: string;
  promptText: string;
  scope?: string;
  role?: string;
  variables?: Readonly<Record<string, unknown>>;
  active?: boolean;
  priority?: number;
  order?: number;
  language?: string;
  attribution?: PromptAttribution;
  visibility?: VisibilityScope;
}
export interface WorkshopUpdatePromptInput {
  name?: string;
  title?: string;
  promptText?: string;
  scope?: string | null;
  role?: string | null;
  variables?: Readonly<Record<string, unknown>>;
  active?: boolean;
  priority?: number;
  order?: number;
  language?: string;
  attribution?: PromptAttribution;
  visibility?: VisibilityScope;
  expectedRevision: number;
}
export interface WorkshopPromptRevision {
  promptId: string;
  revision: number;
  prompt: WorkshopPrompt;
  actorPrincipalId: string;
  eventId: string;
  createdAt: string;
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
export type SearchAdministrationOperation =
  | { operation: 'materialize'; maxJobs: number; maxRebuildRoots: number }
  | { operation: 'retry-dead'; limit: number }
  | {
      operation: 'adopt-legacy';
      kind: 'task' | 'memory' | 'prompt';
      limit: number;
    }
  | { operation: 'start-rebuild' | 'activate-rebuild' }
  | {
      operation:
        | 'semantic-select'
        | 'semantic-reconnect'
        | 'semantic-retire'
        | 'semantic-delete-embeddings';
      configurationId: string;
    }
  | {
      operation: 'semantic-estimate';
      configurationId: string;
      policy: Readonly<Record<string, unknown>>;
    }
  | {
      operation:
        | 'semantic-approve'
        | 'semantic-run'
        | 'semantic-resume'
        | 'semantic-pause'
        | 'semantic-stop'
        | 'semantic-retry';
      planId: string;
    }
  | {
      operation: 'semantic-exclude';
      configurationId: string;
      generation: number;
      derivedId: string;
      reason: string;
    };
export interface SearchAdministrationClient {
  inspect(options?: RequestOptions): Promise<unknown>;
  execute(
    input: SearchAdministrationOperation,
    options?: RequestOptions,
  ): Promise<unknown>;
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

export interface TaprootResourceCollection {
  get(id: string, options?: RequestOptions): Promise<TaprootResource>;
  getRevision(
    id: string,
    revision: number,
    options?: RequestOptions,
  ): Promise<TaprootResource>;
  hydrate(id: string, options?: RequestOptions): Promise<ArrayBuffer>;
  create(
    input: TaprootCreateResourceInput,
    options?: RequestOptions,
  ): Promise<TaprootResource>;
  update(
    id: string,
    input: Partial<Omit<TaprootCreateResourceInput, 'id' | 'itemId'>>,
    options: MutationOptions,
  ): Promise<TaprootResource>;
  delete(id: string, options: MutationOptions): Promise<TaprootResource>;
}
export interface TaprootAnnotationCollection {
  get(id: string, options?: RequestOptions): Promise<TaprootAnnotation>;
  getRevision(
    id: string,
    revision: number,
    options?: RequestOptions,
  ): Promise<TaprootAnnotation>;
  create(
    input: TaprootCreateAnnotationInput,
    options?: RequestOptions,
  ): Promise<TaprootAnnotation>;
  update(
    id: string,
    input: TaprootCreateAnnotationInput,
    options: MutationOptions,
  ): Promise<TaprootAnnotation>;
  delete(id: string, options: MutationOptions): Promise<TaprootAnnotation>;
}
export interface PromptFilters {
  text?: string;
  active?: boolean;
  role?: string;
  scope?: string;
  cursor?: string;
  limit?: number;
}
export interface PromptPage {
  items: WorkshopPrompt[];
  cursor?: string;
}
export interface WorkshopPromptCollection {
  list(filters?: PromptFilters, options?: RequestOptions): Promise<PromptPage>;
  get(id: string, options?: RequestOptions): Promise<WorkshopPrompt>;
  create(
    input: WorkshopCreatePromptInput,
    options?: RequestOptions,
  ): Promise<WorkshopPrompt>;
  update(
    id: string,
    input: WorkshopUpdatePromptInput,
    options?: RequestOptions,
  ): Promise<WorkshopPrompt>;
  delete(
    id: string,
    expectedRevision: number,
    options?: RequestOptions,
  ): Promise<void>;
  history(
    id: string,
    options?: RequestOptions,
  ): Promise<WorkshopPromptRevision[]>;
}
export type SearchHydratedValue =
  | WikibaseEntity
  | TaskRecord
  | MemoryRecord
  | WorkshopPrompt
  | TaprootResource
  | TaprootAnnotation;

/** Presentation-only records. Canonical protocol clients return the types above. */
export interface ContentRevisionMetadata {
  revision: number;
  timestamp: string;
  author?: string;
  summary?: string;
}
export interface RevisionPage {
  revisions: ContentRevisionMetadata[];
  nextCursor?: string;
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
export type ResourceInput = Omit<
  ResourceRecord,
  'id' | 'revision' | 'modified'
>;
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
export type AnnotationInput = Omit<
  AnnotationRecord,
  'id' | 'revision' | 'modified' | 'inheritedVisibility'
>;
export interface PromptRecord {
  id: string;
  revision: number;
  title: string;
  text: string;
  language?: string;
  variables?: readonly string[];
  modified?: string;
}
export type PromptInput = Omit<PromptRecord, 'id' | 'revision' | 'modified'>;

/** @deprecated Host-specific collection retained only as a source-level helper. */
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
