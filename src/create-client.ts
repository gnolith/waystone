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
  };
}
