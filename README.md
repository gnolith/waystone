# Waystone

Waystone is the accessible React UI package for Gnolith. It is intentionally a browser-only consumer of a Workshop client:

```ts
client.call(name, input, { signal });
```

Waystone owns presentation, interaction state, redacted diagnostics, and static UI extensions. Workshop owns transport, authentication, authorization, operation inputs and outputs, and protocol errors. Host applications own routes and deployment.

## Install

```sh
npm install @gnolith/waystone react react-dom @gnolith/workshop
```

```tsx
import { UnifiedSearchScreen } from '@gnolith/waystone/client';
import '@gnolith/waystone/styles.css';

export function Search({ client }) {
  return <UnifiedSearchScreen client={client} />;
}
```

The root entry contains server-safe display components. Interactive components are exported by `@gnolith/waystone/client`; static plugin contracts by `/plugin`; screen composition by `/site`; deterministic assets by `/assets`.

See [the 0.3 migration](docs/migration-0.3.md), [client boundary](docs/api-client.md), and [monorepo handoff](docs/monorepo-handoff.md).
