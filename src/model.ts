import type { ReactNode } from 'react';

/**
 * Waystone owns view models only. Canonical operation inputs and outputs belong
 * to Workshop and cross this package boundary through WorkshopClient.call().
 */
export interface WorkshopClient {
  call<Name extends string, Input = undefined, Output = unknown>(
    name: Name,
    input: Input,
    options?: WorkshopCallOptions,
  ): Promise<Output>;
}

export interface WorkshopCallOptions {
  signal?: AbortSignal;
}

export interface WorkshopRequestErrorLike extends Error {
  code: string;
  status?: number;
  requestId?: string;
  issues?: readonly unknown[];
}

export type EntityId = `Q${number}` | `P${number}`;
export type EntityType = 'item' | 'property';
export type StatementRank = 'preferred' | 'normal' | 'deprecated';
export type SnakType = 'value' | 'somevalue' | 'novalue';
export type WaystoneDatatype =
  | 'string'
  | 'url'
  | 'external-id'
  | 'commonsMedia'
  | 'wikibase-item'
  | 'wikibase-property'
  | 'monolingualtext'
  | 'time'
  | 'quantity'
  | 'globe-coordinate'
  | (string & {});

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
  statements: Record<string, WaystoneStatement[]>;
  sitelinks?: Record<string, { title: string; url?: string }>;
  datatype?: WaystoneDatatype;
  revision: number;
  modified: string;
  redirect?: EntityId;
  deleted?: boolean;
}

export interface EntitySearchInput {
  query: string;
  language?: string;
  type?: EntityType;
  limit?: number;
  cursor?: string;
}

export interface EntitySearchHit {
  id: EntityId;
  type: EntityType;
  label?: string;
  description?: string;
  match?: string;
}

export interface EntitySearchResult {
  results: readonly EntitySearchHit[];
  nextCursor?: string;
}

export interface EntityRevisionPage {
  revisions: readonly EntityRevisionMetadata[];
  nextCursor?: string;
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
      truncated?: boolean;
      elapsedMs?: number;
      requestId?: string;
    }
  | {
      kind: 'boolean';
      value: boolean;
      elapsedMs?: number;
      requestId?: string;
    }
  | {
      kind: 'rdf';
      data: string;
      mediaType: string;
      truncated?: boolean;
      elapsedMs?: number;
      requestId?: string;
    };

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
  manageTasks?: boolean;
  manageMemories?: boolean;
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
  operation: string;
  entityId?: string;
  ok: boolean;
  requestId?: string;
}

export interface PluginErrorEvent {
  pluginId: string;
  contributionId?: string;
  error: unknown;
}

export interface WaystoneObservability {
  onNavigation?: (event: NavigationEvent) => void;
  onMutationResult?: (event: MutationResultEvent) => void;
  onPluginError?: (event: PluginErrorEvent) => void;
}

export interface AsyncStateProps {
  loading?: boolean;
  empty?: boolean;
  permissionDenied?: boolean;
  partial?: boolean;
  error?: unknown;
  retry?: () => void;
  children?: ReactNode;
}

export const SEARCH_KINDS = [
  'item',
  'statement',
  'task',
  'memory',
  'prompt',
  'resource',
  'annotation',
] as const;

export type SearchKind = (typeof SEARCH_KINDS)[number];
export type SearchEntityType = 'item' | 'property';

export interface SearchFiltersView {
  languages?: readonly string[];
  sourceRevisions?: readonly string[];
  entityTypes?: readonly SearchEntityType[];
  mediaTypes?: readonly string[];
  active?: boolean;
}

export interface SearchRequestView {
  text: string;
  kinds?: readonly SearchKind[];
  filters?: SearchFiltersView;
  limit?: number;
  cursor?: string;
}

export interface SearchResultView {
  kind: SearchKind;
  sourceId: string;
  sourceRevision: string;
  score: number;
  snippet: string;
  title?: string;
  language?: string;
  entityType?: SearchEntityType;
  matchLabel?: string;
  contributingStatementIds?: readonly string[];
  hiddenDerivedChunk?: boolean;
}

export interface SearchPageView {
  results: readonly SearchResultView[];
  cursor?: string | null;
  partial?: boolean;
  unavailableKinds?: readonly SearchKind[];
}

export type ContentSelectorView =
  | { type: 'fragment'; value: string }
  | { type: 'text-quote'; exact: string; prefix?: string; suffix?: string }
  | { type: 'text-position'; start: number; end: number };

export interface ResourcePreviewView {
  id: string;
  itemId: EntityId;
  revision: number;
  title?: string;
  mediaType: string;
  language?: string;
  byteLength: number;
  sha256: string;
  payloadKind: 'inline-text' | 'external' | 'binary';
  text?: string;
  externalUrl?: string;
  activeContent?: boolean;
  modified?: string;
}

export interface AnnotationViewModel {
  id: string;
  revision: number;
  bodyText?: string;
  bodyResourceId?: string;
  targetKind: SearchKind;
  targetId: string;
  selector?: ContentSelectorView;
  motivation?: string;
  creatorLabel?: string;
  language?: string;
  mediaType?: string;
  modified?: string;
}

export interface PromptViewModel {
  id: string;
  name: string;
  title: string;
  promptText: string;
  variables: Readonly<Record<string, unknown>>;
  active: boolean;
  priority: number;
  order: number;
  language: string;
  revision: number;
  scope?: string;
  role?: string;
  updatedAt?: string;
}

export interface MemoryViewModel {
  slug: string;
  title: string;
  description: string;
  content: string;
  language: string;
  revision: number;
  updatedAt: string;
}

export type TaskStateView = 'unclaimed' | 'claimed' | 'completed' | 'archived';

export interface TaskLeaseView {
  ownerPrincipalId?: string;
  claimedAt?: string;
  expiresAt?: string;
  expired?: boolean;
}

export interface TaskViewModel {
  id: string;
  title: string;
  description: string;
  objective?: string;
  state: TaskStateView;
  constraints: readonly string[];
  acceptanceCriteria: readonly string[];
  prompt: string;
  role?: string;
  revision: number;
  updatedAt: string;
  lease?: TaskLeaseView;
  result?: string;
}

export interface TaskPacketView {
  task: TaskViewModel;
  context: readonly {
    label?: string;
    query: string;
    summary?: string;
    unavailable?: boolean;
  }[];
  memories: readonly MemoryViewModel[];
  resolvedAt: string;
}

export interface RevisionView<T> {
  revision: number;
  value: T;
  actorLabel?: string;
  createdAt: string;
}

export interface ReadinessView {
  authenticated: boolean;
  authorized: boolean;
  lexicalReady: boolean;
  semanticConfigured: boolean;
  semanticReady: boolean;
  semanticReason?: string;
  partial?: boolean;
  requestId?: string;
}

export interface SearchAdministrationView {
  authorized: boolean;
  state: 'idle' | 'running' | 'paused' | 'degraded' | 'failed';
  selectedConfiguration?: string;
  pendingJobs?: number;
  failures?: readonly {
    id: string;
    kind: string;
    message: string;
    retryable: boolean;
  }[];
}

export interface WaystoneAssetManifest {
  format: 'waystone-assets-v1';
  files: readonly {
    path: string;
    sha256: string;
    bytes: number;
    mediaType: string;
    immutable: true;
  }[];
  entrypoint: string;
  manifestSha256: string;
}

export interface ContentRevisionMetadata {
  revision: number;
  modified: string;
  actor?: string;
  summary?: string;
}

export interface RevisionPage {
  revisions: readonly ContentRevisionMetadata[];
  cursor?: string | null;
}

/** @deprecated Use ResourcePreviewView. Removed after the 0.3 transition. */
export type ResourceRecord = ResourcePreviewView;
/** @deprecated Use AnnotationViewModel. Removed after the 0.3 transition. */
export type AnnotationRecord = AnnotationViewModel;
/** @deprecated Use PromptViewModel. Removed after the 0.3 transition. */
export type PromptRecord = PromptViewModel;
