import { api, entityId, taproot } from '../../../../_taproot';

interface Context {
  params:
    | { id: string; revision: string }
    | Promise<{ id: string; revision: string }>;
}

export async function GET(request: Request, context: Context) {
  return api(request, async () => {
    const { id, revision } = await context.params;
    return (await taproot(request)).getEntityRevision(
      entityId(id),
      Number(revision),
    );
  });
}
