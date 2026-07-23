'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  WorkshopCallOptions,
  WorkshopClient,
  WorkshopRequestErrorLike,
} from './model.js';

export type OperationState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; value: T }
  | { status: 'error'; error: unknown };

export function isWorkshopRequestError(
  value: unknown,
): value is WorkshopRequestErrorLike {
  return (
    value instanceof Error &&
    'code' in value &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}

export async function callWorkshop<Input, Output>(
  client: WorkshopClient,
  operation: string,
  input: Input,
  options?: WorkshopCallOptions,
): Promise<Output> {
  return client.call<string, Input, Output>(operation, input, options);
}

export function useWorkshopOperation<Input, Output>(
  client: WorkshopClient,
  operation: string,
) {
  const [state, setState] = useState<OperationState<Output>>({
    status: 'idle',
  });
  const controller = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  const run = useCallback(
    async (input: Input) => {
      controller.current?.abort();
      const nextController = new AbortController();
      controller.current = nextController;
      setState({ status: 'loading' });
      try {
        const value = await callWorkshop<Input, Output>(
          client,
          operation,
          input,
          { signal: nextController.signal },
        );
        if (!nextController.signal.aborted)
          setState({ status: 'success', value });
        return value;
      } catch (error) {
        if (!nextController.signal.aborted)
          setState({ status: 'error', error });
        throw error;
      }
    },
    [client, operation],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);
  return { state, run, reset };
}
