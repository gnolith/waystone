import type { EntityMutationInput } from '@gnolith/waystone';
import { applyWaystoneMutations } from '../../_mutations';
import { api, entityId, expectedRevision, taproot } from '../../_taproot';

interface Context {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  return api(request, async () => {
    const { id } = await context.params;
    return (await taproot(request)).getEntity(entityId(id));
  });
}

export async function PATCH(request: Request, context: Context) {
  return api(request, async () => {
    const { id } = await context.params;
    const repository = await taproot(request);
    return applyWaystoneMutations(
      repository,
      request,
      entityId(id),
      (await request.json()) as EntityMutationInput,
      expectedRevision(request),
    );
  });
}
