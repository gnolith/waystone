# API client

`createWaystoneClient()` defaults to same-origin paths under `/api/entities` and `/api/sparql`. Supply `baseUrl` for another origin, `fetch` for tests or non-browser runtimes, `getAccessToken` for per-request credentials, `defaultHeaders` for host metadata, and `paths` to match generated routes.

The client exposes `entities.search`, `get`, `getRevision`, `listRevisions`, `create`, and `mutate`, plus SPARQL `validate`, `dryRun`, and `query`. Mutation options require `expectedRevision`; it is sent as an `If-Match` value. A 409 or 412 becomes a `WaystoneRequestError` with kind `conflict`. Validation, permission, missing-resource, network, server, and unsupported failures remain distinct.

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
