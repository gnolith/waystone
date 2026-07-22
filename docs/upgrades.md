# Upgrade policy

Waystone follows Semantic Versioning. Before 1.0, minor versions may adjust TypeScript and component contracts; changelog entries and migration notes are required. Patch versions preserve the documented public API and CSS variable meanings.

After 1.0, removing or changing an export, protocol field, plugin contribution shape, stable CSS variable, supported peer range, or error kind requires a major version. New optional props, components, contribution types, and additive protocol fields are minor changes. Fixes that preserve behavior are patches.

Gnolith packages are versioned independently. The current line supports optional `@gnolith/taproot >=0.4.0 <0.5.0` and `@gnolith/workshop >=0.4.1 <0.5.0`. Waystone imports neither runtime. Exact packed-artifact conformance verifies search, content, Prompt, statement, and command declarations before release; assembled Site acceptance remains a host responsibility.

Waystone 0.1.1 could fail strict declaration checking because it did not declare `@types/react` as a peer and exposed Taproot root declaration references. Upgrade to 0.1.2 for strict TypeScript 5.9 `NodeNext` projects with `skipLibCheck: false`. The adapters and their runtime JSON behavior are unchanged; only the declaration boundary and required React type peer changed.

The unreleased authored-statement-text contract is not compatible with Taproot 0.2 even though Waystone 0.1.2 was. See [Taproot integration](taproot-dependencies.md) for the pinned commit conformance and exact release order.
