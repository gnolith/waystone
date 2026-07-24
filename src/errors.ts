import type { WorkshopRequestErrorLike } from './model.js';

const SECRET_PATTERN =
  /(?:authorization|bearer|token|api[_-]?key|password|cookie|secret)\s*[:=]?\s*[^\s,;]+/gi;

export function redactPublicText(value: string, limit = 240): string {
  const redacted = value.replace(SECRET_PATTERN, '[redacted]');
  return redacted.length <= limit ? redacted : `${redacted.slice(0, limit)}…`;
}

export function publicErrorMessage(error: unknown): string {
  if (!isWorkshopRequestErrorLike(error))
    return 'The request could not be completed. Try again.';
  switch (error.code) {
    case 'bad_request':
    case 'validation_failed':
      return redactPublicText(error.message);
    case 'unauthenticated':
      return 'Sign in again to continue.';
    case 'forbidden':
      return 'You do not have permission to complete this request.';
    case 'conflict':
      return 'This information changed. Refresh it before trying again.';
    case 'dependency_unavailable':
      return 'A required service is temporarily unavailable. Retry shortly.';
    case 'cancelled':
      return 'The request was cancelled.';
    default:
      return 'The request could not be completed. Try again.';
  }
}

function isWorkshopRequestErrorLike(
  value: unknown,
): value is WorkshopRequestErrorLike {
  return (
    value instanceof Error &&
    'code' in value &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}
