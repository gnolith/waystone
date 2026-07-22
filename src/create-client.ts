import { errorKindForStatus, WaystoneRequestError } from './errors.js';
import type {
  EntityMutationInput,
  EntitySearchInput,
  RequestOptions,
  MutationOptions,
  SparqlQueryResult,
  SparqlValidationResult,
  WaystoneClient,
  WaystoneObservability,
  WikibaseEntity,
  EntitySearchResult,
  EntityRevisionPage,
  CreateEntityInput,
  AnnotationInput,
  AnnotationRecord,
  BackfillEstimate,
  HostOperation,
  HostOperationKind,
  PromptInput,
  PromptRecord,
  ResourceInput,
  ResourceRecord,
  RevisionPage,
  SearchHealth,
  SearchRunAction,
  UnifiedSearchInput,
  UnifiedSearchPage,
  TaskRecord,
  MemoryRecord,
} from './model.js';
import {
  fromTaprootEntity,
  fromTaprootRevisionMetadata,
  fromTaprootSearchPage,
  type TaprootPage,
  type TaprootRevisionEntry,
  type TaprootSearchResult,
  type TaprootStoredEntity,
  type TaprootWikibaseEntity,
} from './taproot-adapter.js';

export interface WaystoneApiPaths {
  entities: string;
  entity(id: string): string;
  revision(id: string, revision: number): string;
  revisions(id: string): string;
  sparql: string;
  sparqlValidate: string;
  sparqlDryRun: string;
  search: string;
  searchHealth: string;
  searchAdmin: string;
  resources: string;
  resource(id: string): string;
  resourceRevision(id: string, revision: number): string;
  resourceRevisions(id: string): string;
  annotations: string;
  annotation(id: string): string;
  annotationRevision(id: string, revision: number): string;
  annotationRevisions(id: string): string;
  prompts: string;
  prompt(id: string): string;
  promptRevision(id: string, revision: number): string;
  promptRevisions(id: string): string;
  task(id: string): string;
  memory(id: string): string;
  hostOperations: string;
}
export interface CreateWaystoneClientOptions {
  baseUrl?: string | URL;
  fetch?: typeof globalThis.fetch;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  defaultHeaders?: HeadersInit;
  paths?: Partial<WaystoneApiPaths>;
  onRequestError?: (error: WaystoneRequestError) => void;
  observability?: WaystoneObservability;
  decodeEntity?: (value: unknown) => WikibaseEntity;
  decodeSearch?: (value: unknown) => EntitySearchResult;
  decodeRevisions?: (value: unknown) => EntityRevisionPage;
}

const defaultPaths: WaystoneApiPaths = {
  entities: '/api/entities',
  entity: (id) => `/api/entities/${encodeURIComponent(id)}`,
  revision: (id, revision) =>
    `/api/entities/${encodeURIComponent(id)}/revisions/${revision}`,
  revisions: (id) => `/api/entities/${encodeURIComponent(id)}/revisions`,
  sparql: '/api/sparql',
  sparqlValidate: '/api/sparql/validate',
  sparqlDryRun: '/api/sparql/dry-run',
  search: '/api/search',
  searchHealth: '/api/search/health',
  searchAdmin: '/api/search/admin',
  resources: '/api/resources',
  resource: (id) => `/api/resources/${encodeURIComponent(id)}`,
  resourceRevision: (id, revision) =>
    `/api/resources/${encodeURIComponent(id)}/revisions/${revision}`,
  resourceRevisions: (id) =>
    `/api/resources/${encodeURIComponent(id)}/revisions`,
  annotations: '/api/annotations',
  annotation: (id) => `/api/annotations/${encodeURIComponent(id)}`,
  annotationRevision: (id, revision) =>
    `/api/annotations/${encodeURIComponent(id)}/revisions/${revision}`,
  annotationRevisions: (id) =>
    `/api/annotations/${encodeURIComponent(id)}/revisions`,
  prompts: '/api/prompts',
  prompt: (id) => `/api/prompts/${encodeURIComponent(id)}`,
  promptRevision: (id, revision) =>
    `/api/prompts/${encodeURIComponent(id)}/revisions/${revision}`,
  promptRevisions: (id) => `/api/prompts/${encodeURIComponent(id)}/revisions`,
  task: (id) => `/api/tasks/${encodeURIComponent(id)}`,
  memory: (id) => `/api/memories/${encodeURIComponent(id)}`,
  hostOperations: '/api/operations',
};

function resolveUrl(
  baseUrl: string | URL | undefined,
  path: string,
  query?: URLSearchParams,
): string {
  const suffix = query?.size
    ? `${path}${path.includes('?') ? '&' : '?'}${query}`
    : path;
  if (baseUrl)
    return new URL(
      suffix.replace(/^\//, ''),
      new URL(baseUrl.toString().replace(/\/?$/, '/')),
    ).toString();
  return suffix;
}

async function readError(response: Response): Promise<WaystoneRequestError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  const record =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>)
      : undefined;
  const message =
    typeof record?.message === 'string'
      ? record.message
      : `Request failed with status ${response.status}`;
  const requestId =
    response.headers.get('x-request-id') ??
    (typeof record?.requestId === 'string' ? record.requestId : undefined);
  return new WaystoneRequestError(message, {
    kind: errorKindForStatus(response.status),
    status: response.status,
    ...(requestId ? { requestId } : {}),
    ...(Array.isArray(record?.issues) ? { issues: record.issues } : {}),
  });
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function defaultEntityDecoder(value: unknown): WikibaseEntity {
  const body = record(value);
  const nested = record(body?.entity);
  if (nested && 'claims' in nested && 'lastrevid' in nested) {
    if ('deletedAt' in (body ?? {}) || 'redirectTo' in (body ?? {}))
      return fromTaprootEntity(body as unknown as TaprootStoredEntity);
    return fromTaprootEntity(nested as unknown as TaprootWikibaseEntity);
  }
  if (body && 'claims' in body && 'lastrevid' in body)
    return fromTaprootEntity(body as unknown as TaprootWikibaseEntity);
  return value as WikibaseEntity;
}

function defaultSearchDecoder(value: unknown): EntitySearchResult {
  const body = record(value);
  if (body && Array.isArray(body.items))
    return fromTaprootSearchPage(value as TaprootPage<TaprootSearchResult>);
  return value as EntitySearchResult;
}

function defaultRevisionsDecoder(value: unknown): EntityRevisionPage {
  const body = record(value);
  if (body && Array.isArray(body.items)) {
    const page = value as TaprootPage<TaprootRevisionEntry>;
    return {
      revisions: page.items.map(fromTaprootRevisionMetadata),
      ...(page.cursor ? { nextCursor: page.cursor } : {}),
    };
  }
  return value as EntityRevisionPage;
}

function assertAuthoredStatementText(input: EntityMutationInput): void {
  for (const operation of input.operations) {
    const text =
      operation.op === 'add-statement' || operation.op === 'replace-statement'
        ? operation.statement.text
        : operation.op === 'set-rank'
          ? operation.text
          : undefined;
    if (
      (operation.op === 'add-statement' ||
        operation.op === 'replace-statement' ||
        operation.op === 'set-rank') &&
      (typeof text !== 'string' || !text.trim())
    ) {
      throw new WaystoneRequestError(
        'Authored statement text is required for this revision.',
        { kind: 'validation' },
      );
    }
  }
}

export function createWaystoneClient(
  options: CreateWaystoneClientOptions = {},
): WaystoneClient {
  const fetcher = options.fetch ?? globalThis.fetch;
  if (!fetcher)
    throw new TypeError(
      'createWaystoneClient requires a fetch implementation in this runtime.',
    );
  const paths = { ...defaultPaths, ...options.paths };
  const decodeEntity = options.decodeEntity ?? defaultEntityDecoder;
  const decodeSearch = options.decodeSearch ?? defaultSearchDecoder;
  const decodeRevisions = options.decodeRevisions ?? defaultRevisionsDecoder;

  async function request<T>(
    path: string,
    init: RequestInit = {},
    requestOptions?: RequestOptions,
  ): Promise<T> {
    const headers = new Headers(options.defaultHeaders);
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    new Headers(requestOptions?.headers).forEach((value, key) =>
      headers.set(key, value),
    );
    if (init.body && !headers.has('content-type'))
      headers.set('content-type', 'application/json');
    const token = await options.getAccessToken?.();
    if (token) headers.set('authorization', `Bearer ${token}`);
    let response: Response;
    try {
      response = await fetcher(resolveUrl(options.baseUrl, path), {
        ...init,
        headers,
        ...(requestOptions?.signal ? { signal: requestOptions.signal } : {}),
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError')
        throw cause;
      const error = new WaystoneRequestError('The Site could not be reached.', {
        kind: 'network',
        cause,
      });
      options.onRequestError?.(error);
      options.observability?.onRequestError?.(error);
      throw error;
    }
    if (!response.ok) {
      const error = await readError(response);
      options.onRequestError?.(error);
      options.observability?.onRequestError?.(error);
      throw error;
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const mutation = (
    method: string,
    body: unknown,
    mutationOptions?: MutationOptions,
  ): RequestInit => ({
    method,
    body: JSON.stringify(body),
    ...(mutationOptions
      ? { headers: { 'if-match': `"${mutationOptions.expectedRevision}"` } }
      : {}),
  });

  const contentCollection = <TRecord, TInput>(config: {
    collection: string;
    item(id: string): string;
    revision(id: string, revision: number): string;
    revisions(id: string): string;
  }) => ({
    get(id: string, requestOptions?: RequestOptions) {
      return request<TRecord>(config.item(id), {}, requestOptions);
    },
    getRevision(id: string, revision: number, requestOptions?: RequestOptions) {
      return request<TRecord>(
        config.revision(id, revision),
        {},
        requestOptions,
      );
    },
    listRevisions(id: string, requestOptions?: RequestOptions) {
      return request<RevisionPage>(config.revisions(id), {}, requestOptions);
    },
    create(input: TInput, requestOptions?: RequestOptions) {
      return request<TRecord>(
        config.collection,
        mutation('POST', input),
        requestOptions,
      );
    },
    update(id: string, input: TInput, mutationOptions?: MutationOptions) {
      return request<TRecord>(
        config.item(id),
        mutation('PATCH', input, mutationOptions),
        mutationOptions,
      );
    },
  });

  const adminAction = <T = SearchHealth>(
    action: string,
    body: unknown = {},
    requestOptions?: RequestOptions,
  ) =>
    request<T>(
      `${paths.searchAdmin}/${action}`,
      mutation('POST', body),
      requestOptions,
    );

  return {
    entities: {
      search(input: EntitySearchInput, requestOptions?: RequestOptions) {
        const query = new URLSearchParams({ q: input.query });
        if (input.language) query.set('language', input.language);
        if (input.type) query.set('type', input.type);
        if (input.cursor) query.set('cursor', input.cursor);
        if (input.limit !== undefined) query.set('limit', String(input.limit));
        return request<unknown>(
          `${paths.entities}?${query}`,
          {},
          requestOptions,
        ).then(decodeSearch);
      },
      get(id, requestOptions) {
        return request<unknown>(paths.entity(id), {}, requestOptions).then(
          decodeEntity,
        );
      },
      getRevision(id, revision, requestOptions) {
        return request<unknown>(
          paths.revision(id, revision),
          {},
          requestOptions,
        ).then(decodeEntity);
      },
      listRevisions(id, requestOptions) {
        return request<unknown>(paths.revisions(id), {}, requestOptions).then(
          decodeRevisions,
        );
      },
      async create(
        input: CreateEntityInput,
        mutationOptions?: MutationOptions,
      ) {
        try {
          const value = await request<unknown>(
            paths.entities,
            mutation('POST', input, mutationOptions),
            mutationOptions,
          );
          const entity = decodeEntity(value);
          options.observability?.onMutationResult?.({
            entityId: entity.id,
            operation: 'create',
            ok: true,
          });
          return entity;
        } catch (cause) {
          options.observability?.onMutationResult?.({
            operation: 'create',
            ok: false,
            ...(cause instanceof WaystoneRequestError && cause.requestId
              ? { requestId: cause.requestId }
              : {}),
          });
          throw cause;
        }
      },
      async mutate(
        id,
        input: EntityMutationInput,
        mutationOptions?: MutationOptions,
      ) {
        const operation = input.operations.map((item) => item.op).join(',');
        try {
          assertAuthoredStatementText(input);
          const value = await request<unknown>(
            paths.entity(id),
            mutation('PATCH', input, mutationOptions),
            mutationOptions,
          );
          const entity = decodeEntity(value);
          options.observability?.onMutationResult?.({
            entityId: entity.id,
            operation,
            ok: true,
          });
          return entity;
        } catch (cause) {
          options.observability?.onMutationResult?.({
            entityId: id,
            operation,
            ok: false,
            ...(cause instanceof WaystoneRequestError && cause.requestId
              ? { requestId: cause.requestId }
              : {}),
          });
          throw cause;
        }
      },
    },
    sparql: {
      validate(query, requestOptions) {
        return request<SparqlValidationResult>(
          paths.sparqlValidate,
          mutation('POST', { query }),
          requestOptions,
        );
      },
      dryRun(query, requestOptions) {
        return request<SparqlQueryResult>(
          paths.sparqlDryRun,
          mutation('POST', { query }),
          requestOptions,
        );
      },
      query(query, requestOptions) {
        return request<SparqlQueryResult>(
          paths.sparql,
          mutation('POST', { query }),
          requestOptions,
        );
      },
    },
    search: {
      query(input: UnifiedSearchInput, requestOptions?: RequestOptions) {
        if (!input.query.trim())
          throw new WaystoneRequestError('A search query is required.', {
            kind: 'validation',
          });
        if (
          input.pageSize !== undefined &&
          (!Number.isInteger(input.pageSize) ||
            input.pageSize < 1 ||
            input.pageSize > 100)
        )
          throw new WaystoneRequestError(
            'Search page size must be between 1 and 100.',
            { kind: 'validation' },
          );
        const query = new URLSearchParams({ q: input.query });
        for (const kind of input.kinds ?? []) query.append('kind', kind);
        if (input.cursor) query.set('cursor', input.cursor);
        if (input.pageSize !== undefined)
          query.set('pageSize', String(input.pageSize));
        for (const [key, value] of Object.entries(input.filters ?? {}))
          if (typeof value === 'string' && value) query.set(key, value);
        return request<UnifiedSearchPage>(
          resolveUrl(undefined, paths.search, query),
          {},
          requestOptions,
        );
      },
      health(requestOptions?: RequestOptions) {
        return request<SearchHealth>(paths.searchHealth, {}, requestOptions);
      },
      admin: {
        estimateBackfill(requestOptions?: RequestOptions) {
          return adminAction<BackfillEstimate>('estimate', {}, requestOptions);
        },
        approveBackfill(estimateId: string, requestOptions?: RequestOptions) {
          return adminAction('approve', { estimateId }, requestOptions);
        },
        selectConfiguration(id: string, requestOptions?: RequestOptions) {
          return adminAction('configuration/select', { id }, requestOptions);
        },
        control(action: SearchRunAction, requestOptions?: RequestOptions) {
          return adminAction('run', { action }, requestOptions);
        },
        retryFailure(id: string, requestOptions?: RequestOptions) {
          return adminAction('failure/retry', { id }, requestOptions);
        },
        excludeFailure(id: string, requestOptions?: RequestOptions) {
          return adminAction('failure/exclude', { id }, requestOptions);
        },
        reconnectCircuit(id: string, requestOptions?: RequestOptions) {
          return adminAction('circuit/reconnect', { id }, requestOptions);
        },
        retireConfiguration(id: string, requestOptions?: RequestOptions) {
          return adminAction('configuration/retire', { id }, requestOptions);
        },
        deleteEmbeddings(id: string, requestOptions?: RequestOptions) {
          return adminAction('embeddings/delete', { id }, requestOptions);
        },
      },
    },
    resources: contentCollection<ResourceRecord, ResourceInput>({
      collection: paths.resources,
      item: paths.resource,
      revision: paths.resourceRevision,
      revisions: paths.resourceRevisions,
    }),
    annotations: contentCollection<AnnotationRecord, AnnotationInput>({
      collection: paths.annotations,
      item: paths.annotation,
      revision: paths.annotationRevision,
      revisions: paths.annotationRevisions,
    }),
    prompts: contentCollection<PromptRecord, PromptInput>({
      collection: paths.prompts,
      item: paths.prompt,
      revision: paths.promptRevision,
      revisions: paths.promptRevisions,
    }),
    tasks: {
      get(id: string, requestOptions?: RequestOptions) {
        return request<TaskRecord>(paths.task(id), {}, requestOptions);
      },
    },
    memories: {
      get(id: string, requestOptions?: RequestOptions) {
        return request<MemoryRecord>(paths.memory(id), {}, requestOptions);
      },
    },
    hostOperations: {
      list(requestOptions?: RequestOptions) {
        return request<readonly HostOperation[]>(
          paths.hostOperations,
          {},
          requestOptions,
        );
      },
      start(kind: HostOperationKind, requestOptions?: RequestOptions) {
        return request<HostOperation>(
          paths.hostOperations,
          mutation('POST', { kind }),
          requestOptions,
        );
      },
    },
  };
}
