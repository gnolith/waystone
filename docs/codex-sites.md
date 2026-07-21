# Codex Sites integration

Waystone provides React 19 ESM exports intended for generated App Router consumers. Package runtime code uses Web APIs and imports no Node built-ins, Cloudflare bindings, D1, R2, Drizzle, or dynamic filesystem APIs.

Generated Site files own route generation, complete package assembly, resource bindings, migrations, authentication, runtime configuration, and deployment acceptance. Import Waystone CSS in the layout, create the client and registry once at module scope, render server-safe displays where possible, and place interactive editors in leaf client components.

The isolated consumer under `examples/codex-site-canary` installs the exact Waystone tarball, builds representative routes, and server-renders `/`, `/onboarding`, `/entities`, `/entities/[id]`, `/properties/[id]`, and `/sparql`. It uses Waystone's own fixtures and mock client. It does not provision resources, assemble sibling repositories, deploy a Site, or qualify a production host.

The package's `npm run verify:package` rejects missing exports or declarations, client code reached by the server-safe root, forbidden Node or Cloudflare runtime imports, bundled React, and unintended tarball files. These checks establish properties of the Waystone package only; the Codex agent creating a Site owns validation of the complete generated application in its selected host runtime.
