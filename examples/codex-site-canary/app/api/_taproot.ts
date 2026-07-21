import {
  EntityNotFoundError,
  InvalidEntityError,
  InvalidCursorError,
  RevisionConflictError,
  TaprootError,
  TaprootRepository,
  initializeTaproot,
  type D1DatabaseLike,
  type EntityId,
} from '@gnolith/taproot';

let initialization: Promise<void> | undefined;

export async function database(): Promise<D1DatabaseLike> {
  const { env } = await import('cloudflare:workers');
  const db = env.DB as D1DatabaseLike | undefined;
  if (!db) throw new Error('The managed D1 binding is unavailable.');
  return db;
}

export async function taproot(request: Request): Promise<TaprootRepository> {
  const db = await database();
  initialization ??= initializeTaproot(db);
  await initialization;
  return new TaprootRepository(db, {
    baseIri: `${new URL(request.url).origin}/knowledge`,
    requireAttribution: true,
  });
}

export function entityId(value: string): EntityId {
  if (!/^[QP][1-9][0-9]*$/u.test(value))
    throw new InvalidEntityError(`Invalid entity ID: ${value}`);
  return value as EntityId;
}

export function expectedRevision(request: Request): number {
  const value = request.headers.get('if-match')?.replace(/^"|"$/gu, '');
  if (!value || !/^\d+$/u.test(value))
    throw new InvalidEntityError('If-Match must contain an entity revision.');
  return Number(value);
}

export function edit(request: Request, revision: number) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  return {
    expectedRevision: revision,
    attribution: {
      id: 'canary:researcher',
      kind: 'human' as const,
      name: 'Canary researcher',
    },
    requestId,
  };
}

function status(error: unknown): number {
  if (error instanceof RevisionConflictError) return 409;
  if (error instanceof EntityNotFoundError) return 404;
  if (
    error instanceof InvalidEntityError ||
    error instanceof InvalidCursorError
  )
    return 422;
  if (error instanceof TypeError) return 422;
  return 500;
}

export async function api(
  request: Request,
  operation: () => Promise<unknown>,
): Promise<Response> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const result = await operation();
    return Response.json(result, { headers: { 'x-request-id': requestId } });
  } catch (cause) {
    const responseStatus = status(cause);
    return Response.json(
      {
        message:
          cause instanceof TaprootError ||
          cause instanceof TypeError ||
          responseStatus < 500
            ? cause instanceof Error
              ? cause.message
              : 'Request failed'
            : 'The knowledge service could not complete the request.',
        ...(cause instanceof TaprootError ? { code: cause.code } : {}),
        requestId,
      },
      {
        status: responseStatus,
        headers: { 'cache-control': 'no-store', 'x-request-id': requestId },
      },
    );
  }
}
