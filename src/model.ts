import type { ReactNode } from 'react';

export type EntityId = `Q${number}` | `P${number}`;
export type EntityType = 'item' | 'property';
export type SnakType = 'value' | 'somevalue' | 'novalue';
export type StatementRank = 'preferred' | 'normal' | 'deprecated';
export type WaystoneDatatype =
  | 'wikibase-item'
  | 'wikibase-property'
  | 'string'
  | 'external-id'
  | 'url'
  | 'commonsMedia'
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
  | { op: 'set-rank'; statementId: string; rank: StatementRank }
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
}

export interface WaystoneCapabilities {
  createEntity?: boolean;
  editEntity?: boolean;
  deleteEntity?: boolean;
  revertRevision?: boolean;
  querySparql?: boolean;
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
