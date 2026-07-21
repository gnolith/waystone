# Upgrade policy

Waystone follows Semantic Versioning. Before 1.0, minor versions may adjust TypeScript and component contracts; changelog entries and migration notes are required. Patch versions preserve the documented public API and CSS variable meanings.

After 1.0, removing or changing an export, protocol field, plugin contribution shape, stable CSS variable, supported peer range, or error kind requires a major version. New optional props, components, contribution types, and additive protocol fields are minor changes. Fixes that preserve behavior are patches.

Gnolith packages are versioned independently. A release declares its supported React, TypeScript, vinext, and Taproot ranges in the README and package metadata. The current development line supports optional `@gnolith/taproot >=0.3.0 <0.4.0`; generated Sites using Taproot must provide that peer. The 0.3 floor is required because mandatory authored `Statement.text` and explicit rank/qualifier/reference revision text are breaking changes from Taproot 0.2. Taproot 0.3 must publish first, Waystone must then requalify against that exact published artifact, and assembled Seedbed acceptance follows. Changes to the range require exact-package isolated-consumer verification.

Waystone 0.1.1 could fail strict declaration checking because it did not declare `@types/react` as a peer and exposed Taproot root declaration references. Upgrade to 0.1.2 for strict TypeScript 5.9 `NodeNext` projects with `skipLibCheck: false`. The adapters and their runtime JSON behavior are unchanged; only the declaration boundary and required React type peer changed.

The unreleased authored-statement-text contract is not compatible with Taproot 0.2 even though Waystone 0.1.2 was. See [Taproot integration](taproot-dependencies.md) for the pinned commit conformance and exact release order.
