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
  TaprootCreateAnnotationInput,
  HostOperation,
  HostOperationKind,
  WorkshopCreatePromptInput,
  TaprootCreateResourceInput,
  SearchRequest,
  SearchPage,
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
import {
  decodeAnnotation,
  decodePrompt,
  decodePromptHistory,
  decodeResource,
  decodeSearchPage,
  encodeAnnotationInput,
  encodePromptInput,
  encodeResourceInput,
  encodeSearchRequest,
} from './protocol-adapters.js';

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
  resourcePayload(id: string): string;
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
  search: '/api/workshop/search',
  searchHealth: '/api/workshop/search/status',
  searchAdmin: '/api/workshop/search/admin',
  resources: '/api/resources',
  resource: (id) => `/api/resources/${encodeURIComponent(id)}`,
  resourceRevision: (id, revision) =>
    `/api/resources/${encodeURIComponent(id)}/revisions/${revision}`,
  resourcePayload: (id) => `/api/resources/${encodeURIComponent(id)}/payload`,
  resourceRevisions: (id) =>
    `/api/resources/${encodeURIComponent(id)}/revisions`,
  annotations: '/api/annotations',
  annotation: (id) => `/api/annotations/${encodeURIComponent(id)}`,
  annotationRevision: (id, revision) =>
    `/api/annotations/${encodeURIComponent(id)}/revisions/${revision}`,
  annotationRevisions: (id) =>
    `/api/annotations/${encodeURIComponent(id)}/revisions`,
  prompts: '/api/workshop/prompts',
  prompt: (id) => `/api/workshop/prompts/${encodeURIComponent(id)}`,
  promptRevision: (id, revision) =>
    `/api/workshop/prompts/${encodeURIComponent(id)}/revisions/${revision}`,
  promptRevisions: (id) =>
    `/api/workshop/prompts/${encodeURIComponent(id)}/history`,
  task: (id) => `/api/workshop/tasks/${encodeURIComponent(id)}`,
  memory: (id) => `/api/workshop/memories/${encodeURIComponent(id)}`,
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
  const nestedError =
    record?.error && typeof record.error === 'object'
      ? (record.error as Record<string, unknown>)
      : undefined;
  const message =
    typeof record?.message === 'string'
      ? record.message
      : typeof nestedError?.message === 'string'
        ? nestedError.message
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

  async function requestBinary(
    path: string,
    requestOptions?: RequestOptions,
  ): Promise<ArrayBuffer> {
    const headers = new Headers(options.defaultHeaders);
    new Headers(requestOptions?.headers).forEach((value, key) =>
      headers.set(key, value),
    );
    const token = await options.getAccessToken?.();
    if (token) headers.set('authorization', `Bearer ${token}`);
    const response = await fetcher(resolveUrl(options.baseUrl, path), {
      headers,
      ...(requestOptions?.signal ? { signal: requestOptions.signal } : {}),
    });
    if (!response.ok) throw await readError(response);
    return response.arrayBuffer();
  }

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
      query(input: SearchRequest, requestOptions?: RequestOptions) {
        if (!input.text.trim())
          throw new WaystoneRequestError('A search query is required.', {
            kind: 'validation',
          });
        if (
          input.limit !== undefined &&
          (!Number.isInteger(input.limit) ||
            input.limit < 1 ||
            input.limit > 100)
        )
          throw new WaystoneRequestError(
            'Search page size must be between 1 and 100.',
            { kind: 'validation' },
          );
        return request<SearchPage>(
          paths.search,
          mutation('POST', encodeSearchRequest(input)),
          requestOptions,
        ).then(decodeSearchPage);
      },
      hydrate(result, requestOptions) {
        switch (result.kind) {
          case 'statement':
          case 'item':
            return request<unknown>(
              paths.entity(result.sourceId),
              {},
              requestOptions,
            ).then(decodeEntity);
          case 'task':
            return request<TaskRecord>(
              paths.task(result.sourceId),
              {},
              requestOptions,
            );
          case 'memory':
            return request<MemoryRecord>(
              paths.memory(result.sourceId),
              {},
              requestOptions,
            );
          case 'prompt':
            return request<unknown>(
              paths.prompt(result.sourceId),
              {},
              requestOptions,
            ).then(decodePrompt);
          case 'resource':
            return request<unknown>(
              paths.resource(result.sourceId),
              {},
              requestOptions,
            ).then(decodeResource);
          case 'annotation':
            return request<unknown>(
              paths.annotation(result.sourceId),
              {},
              requestOptions,
            ).then(decodeAnnotation);
        }
      },
      admin: {
        inspect(requestOptions?: RequestOptions) {
          return request<unknown>(paths.searchAdmin, {}, requestOptions);
        },
        execute(
          input: Readonly<Record<string, unknown>>,
          requestOptions?: RequestOptions,
        ) {
          return request<unknown>(
            paths.searchAdmin,
            mutation('POST', input),
            requestOptions,
          );
        },
      },
    },
    resources: {
      get: (id, requestOptions) =>
        request<unknown>(paths.resource(id), {}, requestOptions).then(
          decodeResource,
        ),
      getRevision: (id, revision, requestOptions) =>
        request<unknown>(
          paths.resourceRevision(id, revision),
          {},
          requestOptions,
        ).then(decodeResource),
      hydrate: (id, requestOptions) =>
        requestBinary(paths.resourcePayload(id), requestOptions),
      create: (input: TaprootCreateResourceInput, requestOptions) =>
        request<unknown>(
          paths.resources,
          mutation('POST', encodeResourceInput(input)),
          requestOptions,
        ).then(decodeResource),
      update: (id, input, mutationOptions) =>
        request<unknown>(
          paths.resource(id),
          mutation('PATCH', input, mutationOptions),
          mutationOptions,
        ).then(decodeResource),
      delete: (id, mutationOptions) =>
        request<unknown>(
          paths.resource(id),
          mutation('DELETE', undefined, mutationOptions),
          mutationOptions,
        ).then(decodeResource),
    },
    annotations: {
      get: (id, requestOptions) =>
        request<unknown>(paths.annotation(id), {}, requestOptions).then(
          decodeAnnotation,
        ),
      getRevision: (id, revision, requestOptions) =>
        request<unknown>(
          paths.annotationRevision(id, revision),
          {},
          requestOptions,
        ).then(decodeAnnotation),
      create: (input: TaprootCreateAnnotationInput, requestOptions) =>
        request<unknown>(
          paths.annotations,
          mutation('POST', encodeAnnotationInput(input)),
          requestOptions,
        ).then(decodeAnnotation),
      update: (id, input, mutationOptions) =>
        request<unknown>(
          paths.annotation(id),
          mutation('PATCH', encodeAnnotationInput(input), mutationOptions),
          mutationOptions,
        ).then(decodeAnnotation),
      delete: (id, mutationOptions) =>
        request<unknown>(
          paths.annotation(id),
          mutation('DELETE', undefined, mutationOptions),
          mutationOptions,
        ).then(decodeAnnotation),
    },
    prompts: {
      list(filters, requestOptions) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(filters ?? {}))
          if (value !== undefined) query.set(key, String(value));
        return request<import('./model.js').PromptPage>(
          resolveUrl(undefined, paths.prompts, query),
          {},
          requestOptions,
        ).then((page) => ({ ...page, items: page.items.map(decodePrompt) }));
      },
      get: (id, requestOptions) =>
        request<unknown>(paths.prompt(id), {}, requestOptions).then(
          decodePrompt,
        ),
      create: (input: WorkshopCreatePromptInput, requestOptions) =>
        request<unknown>(
          paths.prompts,
          mutation('POST', encodePromptInput(input)),
          requestOptions,
        ).then(decodePrompt),
      update: (id, input, requestOptions) =>
        request<unknown>(
          paths.prompt(id),
          mutation('PATCH', input),
          requestOptions,
        ).then(decodePrompt),
      delete: (id, expectedRevision, requestOptions) =>
        request<unknown>(
          paths.prompt(id),
          {
            method: 'DELETE',
            headers: { 'x-workshop-revision': String(expectedRevision) },
          },
          requestOptions,
        ).then(() => undefined),
      history: (id, requestOptions) =>
        request<unknown>(paths.promptRevisions(id), {}, requestOptions).then(
          decodePromptHistory,
        ),
    },
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
