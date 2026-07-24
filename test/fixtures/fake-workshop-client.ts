import type { WorkshopClient, WorkshopCallOptions } from '../../src/model.js';
import type {
  OperationInput,
  OperationName,
  OperationOutput,
} from '@gnolith/workshop/client';

export interface RecordedWorkshopCall {
  name: string;
  input: unknown;
  options?: WorkshopCallOptions;
}

export function createFakeWorkshopClient(
  handlers: Readonly<Record<string, unknown>> = {},
) {
  const calls: RecordedWorkshopCall[] = [];
  const client: WorkshopClient = {
    async call<Name extends OperationName>(
      name: Name,
      input: OperationInput<Name>,
      options?: WorkshopCallOptions,
    ): Promise<OperationOutput<Name>> {
      calls.push({
        name,
        input,
        ...(options ? { options } : {}),
      });
      if (options?.signal?.aborted)
        throw Object.assign(new Error('Cancelled'), { code: 'cancelled' });
      const handler = handlers[name];
      if (isFixtureHandler(handler))
        return (await handler(input, options)) as OperationOutput<Name>;
      if (name in handlers) return handler as OperationOutput<Name>;
      throw Object.assign(new Error(`Unhandled fixture operation ${name}`), {
        code: 'fixture_unhandled',
      });
    },
  };
  return { client, calls };
}

type FixtureHandler = (
  input: unknown,
  options?: WorkshopCallOptions,
) => unknown;

function isFixtureHandler(value: unknown): value is FixtureHandler {
  return typeof value === 'function';
}
