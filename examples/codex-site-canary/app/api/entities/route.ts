import type { CreateEntityInput } from '@gnolith/waystone';
import { ENTITY_DATATYPES, type EntityDatatype } from '@gnolith/taproot';
import { api, taproot } from '../_taproot';

export function GET(request: Request) {
  return api(request, async () => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.trim();
    const repository = await taproot(request);
    if (!query)
      return repository.listEntities({
        limit: Number(url.searchParams.get('limit') ?? 25),
        ...(url.searchParams.get('cursor')
          ? { cursor: url.searchParams.get('cursor')! }
          : {}),
      });
    return repository.searchEntitiesPage(query, {
      ...(url.searchParams.get('language')
        ? { language: url.searchParams.get('language')! }
        : {}),
      ...(url.searchParams.get('cursor')
        ? { cursor: url.searchParams.get('cursor')! }
        : {}),
      limit: Number(url.searchParams.get('limit') ?? 25),
    });
  });
}

export function POST(request: Request) {
  return api(request, async () => {
    const input = (await request.json()) as CreateEntityInput;
    const repository = await taproot(request);
    const metadata = {
      attribution: {
        id: 'canary:researcher',
        kind: 'human' as const,
        name: 'Canary researcher',
      },
      requestId: request.headers.get('x-request-id') ?? crypto.randomUUID(),
    };
    const labels = {
      [input.language]: { language: input.language, value: input.label },
    };
    const descriptions = input.description
      ? {
          [input.language]: {
            language: input.language,
            value: input.description,
          },
        }
      : {};
    const datatype = ENTITY_DATATYPES.includes(
      (input.datatype ?? 'string') as EntityDatatype,
    )
      ? ((input.datatype ?? 'string') as EntityDatatype)
      : 'string';
    return input.type === 'property'
      ? repository.createProperty({
          datatype,
          labels,
          descriptions,
          ...metadata,
        })
      : repository.createItem({ labels, descriptions, ...metadata });
  });
}
