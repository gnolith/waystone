export type WaystoneErrorKind =
  | 'validation'
  | 'conflict'
  | 'permission'
  | 'not-found'
  | 'network'
  | 'server'
  | 'plugin'
  | 'unsupported';

export class WaystoneRequestError extends Error {
  readonly kind: WaystoneErrorKind;
  readonly status?: number;
  readonly requestId?: string;
  readonly issues?: readonly unknown[];

  constructor(
    message: string,
    options: {
      kind: WaystoneErrorKind;
      status?: number;
      requestId?: string;
      issues?: readonly unknown[];
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = 'WaystoneRequestError';
    this.kind = options.kind;
    if (options.status !== undefined) this.status = options.status;
    if (options.requestId !== undefined) this.requestId = options.requestId;
    if (options.issues !== undefined) this.issues = options.issues;
  }
}

export function errorKindForStatus(status: number): WaystoneErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401 || status === 403) return 'permission';
  if (status === 404) return 'not-found';
  if (status === 409 || status === 412) return 'conflict';
  return 'server';
}

export function publicErrorMessage(error: unknown): string {
  if (!(error instanceof WaystoneRequestError))
    return 'Something went wrong. Please try again.';
  switch (error.kind) {
    case 'validation':
      return error.message || 'Some information needs attention.';
    case 'conflict':
      return 'This entity changed since you opened it. Review the latest revision before saving again.';
    case 'permission':
      return 'You do not have permission to complete this action.';
    case 'not-found':
      return 'The requested resource could not be found.';
    case 'network':
      return 'The Site could not be reached. Check your connection and try again.';
    case 'unsupported':
      return error.message || 'This value type is not supported.';
    default:
      return 'The Site could not complete the request. Try again or contact a Site administrator.';
  }
}
