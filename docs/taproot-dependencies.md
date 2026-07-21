# Taproot integration

Waystone supports `@gnolith/taproot >=0.1.0-rc.0 <0.2.0` as a peer. The package imports Taproot only as types from its server-safe root; Waystone remains free of D1, Diamond, Drizzle, and Cloudflare runtime dependencies.

Taproot uses canonical Wikibase JSON while Waystone uses a UI-oriented display model. The root export provides explicit adapters for stored entity envelopes, claims, snaks, references, search pages, and revisions. `createWaystoneClient()` applies those adapters to canonical Taproot API responses by default, while custom decoders remain available for installer-specific protocols.

The Codex Sites canary owns the server integration boundary. Its generated-style handlers initialize Taproot against managed D1, enforce attribution and `If-Match` revisions, expose search/entity/revision operations, and project the same data through Diamond for read-only SPARQL. Waystone itself never imports those handlers.

Release verification requires both a successful live mutation and a deliberately stale mutation returning `409`, followed by revision and SPARQL reads of the resulting data. Fixture-only behavior is not accepted for this gate.
