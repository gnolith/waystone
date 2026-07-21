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

export function createWaystoneClient(
  options: CreateWaystoneClientOptions = {},
): WaystoneClient {
  const fetcher = options.fetch ?? globalThis.fetch;
  if (!fetcher)
    throw new TypeError(
      'createWaystoneClient requires a fetch implementation in this runtime.',
    );
  const paths = { ...defaultPaths, ...options.paths };

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
        return request<EntitySearchResult>(
          `${paths.entities}?${query}`,
          {},
          requestOptions,
        );
      },
      get(id, requestOptions) {
        return request<WikibaseEntity>(paths.entity(id), {}, requestOptions);
      },
      getRevision(id, revision, requestOptions) {
        return request<WikibaseEntity>(
          paths.revision(id, revision),
          {},
          requestOptions,
        );
      },
      listRevisions(id, requestOptions) {
        return request<EntityRevisionPage>(
          paths.revisions(id),
          {},
          requestOptions,
        );
      },
      async create(
        input: CreateEntityInput,
        mutationOptions?: MutationOptions,
      ) {
        const entity = await request<WikibaseEntity>(
          paths.entities,
          mutation('POST', input, mutationOptions),
          mutationOptions,
        );
        options.observability?.onMutationResult?.({
          entityId: entity.id,
          operation: 'create',
          ok: true,
        });
        return entity;
      },
      async mutate(
        id,
        input: EntityMutationInput,
        mutationOptions?: MutationOptions,
      ) {
        const entity = await request<WikibaseEntity>(
          paths.entity(id),
          mutation('PATCH', input, mutationOptions),
          mutationOptions,
        );
        options.observability?.onMutationResult?.({
          entityId: entity.id,
          operation: input.operations
            .map((operation) => operation.op)
            .join(','),
          ok: true,
        });
        return entity;
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
