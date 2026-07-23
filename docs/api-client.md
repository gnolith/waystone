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

Search supports exactly `item`, `resource`, `annotation`, `prompt`, `memory`, `task`, and `statement`. A Property is an item result whose `entityType` is `property`. Hydration is a separate authorized `search.hydrate` call.

The repository uses a test-only structural client while the exact breaking Workshop package coordinate is pending. That fixture is not exported or packed.
