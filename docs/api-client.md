# API client

`createWaystoneClient()` defaults to same-origin paths under `/api` for entities, SPARQL, search, Resources, Annotations, Prompts, Task/Memory hydration, search administration, and host data operations. Supply `baseUrl` for another origin, `fetch` for tests or non-browser runtimes, `getAccessToken` for per-request credentials, `defaultHeaders` for host metadata, and `paths` to match generated routes.

The client exposes `entities`, `sparql`, exact Taproot search through Workshop, `search.hydrate`, `search.admin`, Taproot Resource/Annotation CRUD and payload hydration, Workshop Prompt list/CRUD/history, Task/Memory hydration, and host-owned `hostOperations`. Search is `POST /api/workshop/search`; Prompt and search-administration routes use the `/api/workshop/*` boundary. Taproot mutations use exact revision preconditions, while Workshop Prompt deletion uses `X-Workshop-Revision`. A 409 or 412 becomes a `WaystoneRequestError` with kind `conflict`.

Search page size is validated from 1 through 100. Cursors are opaque. Invalid-cursor recovery must explicitly repeat the same query, kinds, and filters without the cursor; the client never retries or broadens automatically. Scores are opaque ordering signals, not percentages, and there is no client-selectable lexical/vector/hybrid mode.

Abort with standard `AbortSignal`. Request IDs are read from `x-request-id` or a structured error response. The access token callback value is only attached to the outgoing request and is never retained or logged.

```ts
import { createWaystoneClient } from '@gnolith/waystone/client';

const client = createWaystoneClient({
  getAccessToken: () => session.accessToken,
  paths: { entities: '/api/knowledge/entities' },
});

await client.entities.mutate(
  'Q42',
  { operations: [{ op: 'set-label', language: 'en', value: 'New label' }] },
  { expectedRevision: 12, signal },
);
```

Generated handlers may use different internal implementations, but their JSON surface must match the exported Waystone protocol types.
