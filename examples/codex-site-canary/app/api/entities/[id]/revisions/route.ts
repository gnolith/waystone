import { api, entityId, taproot } from '../../../_taproot';

interface Context {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  return api(request, async () => {
    const { id } = await context.params;
    const url = new URL(request.url);
    return (await taproot(request)).listEntityRevisionsPage(entityId(id), {
      limit: Number(url.searchParams.get('limit') ?? 25),
      ...(url.searchParams.get('cursor')
        ? { cursor: url.searchParams.get('cursor')! }
        : {}),
    });
  });
}
