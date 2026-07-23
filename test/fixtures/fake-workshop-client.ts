import type { WorkshopClient, WorkshopCallOptions } from '../../src/model.js';

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
    async call<Name extends string, Input = undefined, Output = unknown>(
      name: Name,
      input: Input,
      options?: WorkshopCallOptions,
    ): Promise<Output> {
      calls.push({
        name,
        input,
        ...(options ? { options } : {}),
      });
      if (options?.signal?.aborted)
        throw Object.assign(new Error('Cancelled'), { code: 'cancelled' });
      const handler = handlers[name];
      if (isFixtureHandler(handler))
        return (await handler(input, options)) as Output;
      if (name in handlers) return handler as Output;
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
