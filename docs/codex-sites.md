# Codex Sites compatibility

Waystone targets React 19 in a vinext/Vite App Router application deployed to Cloudflare Workers. Runtime code uses Web APIs only. It imports no Node built-ins, Cloudflare bindings, D1, R2, Drizzle, or dynamic filesystem APIs. No Node compatibility flag is required.

Generated Site files own routes and deployment declarations. Import package CSS in the layout, create the client/registry once at module scope, render server-safe displays where possible, and place interactive editors in leaf client components. The canary under `examples/codex-site-canary` demonstrates `/`, `/onboarding`, `/entities`, `/entities/[id]`, `/properties/[id]`, and `/sparql` using the publishable tarball during release verification.

The package’s `npm run verify:package` rejects missing exports/declarations, client code reached by the server-safe root, forbidden runtime imports, bundled React, and unintended tarball files.
