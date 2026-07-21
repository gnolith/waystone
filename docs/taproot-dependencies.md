# Taproot integration

Waystone supports `@gnolith/taproot >=0.1.0-rc.0 <0.3.0` as a peer and verifies development and package-consumer checks against stable Taproot `0.2.0`. Its adapters use Waystone-owned structural types for the canonical JSON fields they consume. The emitted declarations do not import or re-export Taproot, so an ordinary UI import does not resolve Taproot's Diamond, RDF, or persistence declaration graph. Waystone remains free of D1, Diamond, Drizzle, and Cloudflare runtime dependencies.

Taproot uses canonical Wikibase JSON while Waystone uses a UI-oriented display model. The root export provides explicit adapters for stored entity envelopes, claims, snaks, references, search pages, and revisions. `createWaystoneClient()` applies those adapters to canonical Taproot API responses by default, while custom decoders remain available for installer-specific protocols.

The generated Site owns the server integration boundary. Its handlers may initialize Taproot against managed persistence, enforce attribution and `If-Match` revisions, expose search/entity/revision operations, and project data through Diamond for read-only SPARQL. Waystone itself does not import those handlers or assemble a complete Site.

Waystone verifies its adapters against canonical protocol fixtures typed with public Taproot `0.2.0`, package-owned mock behavior, and an exact packed strict consumer. That consumer installs all peers but asserts that TypeScript does not resolve Taproot, Diamond, Comunica, `rdf-parse`, or `lru-cache` declarations through Waystone. The Codex agent creating a Site owns live mutation, stale-conflict, revision, and SPARQL acceptance against that Site's selected artifacts and resources.
