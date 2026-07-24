# Workshop client boundary

Waystone accepts a structural `WorkshopClient` with one method:

```ts
interface WorkshopClient {
  call<Name extends string, Input, Output>(
    name: Name,
    input: Input,
    options?: { signal?: AbortSignal },
  ): Promise<Output>;
}
```

Applications construct and configure the real client outside Waystone. Waystone never selects an endpoint, creates headers, stores credentials, classifies server failures, or retries transport.

Interactive components call named operations and cancel superseded/unmounted work with `AbortSignal`. Display models in `model.ts` are UI-owned projections, not protocol DTOs.

Search supports exactly `item`, `resource`, `annotation`, `prompt`, `memory`, `task`, and `statement`. A Property is an item result whose `entityType` is `property`. Hydration is a separate authorized `search_hydrate` call.

The public client and operation-name types resolve from exact `@gnolith/workshop@0.5.0`. Tests install its checksum-bound packed archive; the fake client supplies results only and cannot invent operation names.
