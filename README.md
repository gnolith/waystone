# Waystone

**The accessible human interface and extension surface for Gnolith research Sites.**

`@gnolith/waystone` provides the Gnolith application shell, Taproot knowledge browsing and maintenance UI, revision inspection, SPARQL workspace, browser-safe Site API client, compiled theme, and static plugin contract used by Workshop and future modules.

Waystone is a UI and protocol-consumer package. It does not access D1 or R2, project RDF, implement authentication or authorization, create App Router files, run MCP tools, or import Workshop. The host Site owns those systems and composes Waystone with its generated HTTP routes.

Headless and process-based consumers compose Gnolith's non-UI packages directly and must not import Waystone. Waystone belongs only in browser and rendered Site surfaces; persistence, process lifecycle, CLI, and container assembly remain outside this package.

## Status

Waystone 0.1 is a pre-1.0 public API. Its isolated consumer fixture installs the exact package archive, builds representative routes, server-renders the public UI surfaces, and exercises the package-owned fixture plugin. Complete Site assembly and hosted acceptance belong to the Codex agent creating that Site. See [the dependency record](docs/taproot-dependencies.md) and [release evidence](docs/release-evidence.md).

## Install

```sh
npm install @gnolith/waystone react react-dom
```

Import the precompiled CSS once in the generated Site layout:

```tsx
import '@gnolith/waystone/styles.css';
```

The host does not transpile Waystone source or scan it with Tailwind.

## Public entry points

- `@gnolith/waystone` — server-safe display components, protocol models, formatters, and public errors.
- `@gnolith/waystone/client` — browser-safe HTTP client, search, knowledge editors, revision controls, and SPARQL editor.
- `@gnolith/waystone/plugin` — plugin contracts, validation, registry, provider, and extension points.
- `@gnolith/waystone/site` — page-level application composition for generated routes.
- `@gnolith/waystone/fixtures` — representative entities, results, plugins, failures, and a mock client for development only.
- `@gnolith/waystone/styles.css` — compiled production CSS.

Every JavaScript entry has declarations. React is a peer and is never bundled.

## Site composition

```tsx
'use client';

import { createWaystoneClient } from '@gnolith/waystone/client';
import { createWaystoneRegistry } from '@gnolith/waystone/plugin';
import { GnolithHome, GnolithShell } from '@gnolith/waystone/site';

const client = createWaystoneClient();
const registry = createWaystoneRegistry([]);

export function Home() {
  return (
    <GnolithShell
      registry={registry}
      client={client}
      title="Research Site"
      subtitle="One bounded research project"
      currentPath="/"
    >
      <GnolithHome
        client={client}
        summary={{ items: 18, properties: 7, statements: 64 }}
      />
    </GnolithShell>
  );
}
```

Generated routes should create the client and registry once at module scope. Authentication can be supplied with `getAccessToken`; the package neither stores tokens nor logs them.

## Guides

- [API client](docs/api-client.md)
- [Plugin authoring](docs/plugins.md)
- [Components and knowledge workflows](docs/components.md)
- [Styling and public design tokens](docs/styling.md)
- [Accessibility](docs/accessibility.md)
- [Codex Sites and vinext integration](docs/codex-sites.md)
- [Upgrade policy](docs/upgrades.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Release checklist](docs/releasing.md)

## Development

```sh
npm ci
npm run check
npm pack --dry-run
```

`npm run check` formats, lints, type-checks, runs coverage and accessibility tests, builds declarations and CSS, verifies runtime graphs and tarball contents, and enforces bundle budgets.

## Compatibility

- React and React DOM: `>=19 <20`
- Node for development: `>=22`
- Runtime exports: ESM and Web APIs, with package verification rejecting Node and Cloudflare imports reachable from public entry points
- TypeScript consumers: strict projects on currently supported TypeScript 5.9+
- Taproot: `>=0.1.0-rc.0 <0.3.0` (verified with stable `0.2.0`)

## Security

Waystone renders React text rather than untrusted HTML, treats external destinations as untrusted, and reports authorization decisions from the server without pretending client controls enforce policy. Report vulnerabilities according to [SECURITY.md](SECURITY.md).

## License

MIT
