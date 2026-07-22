# Taproot and Workshop protocol boundary

Waystone supports optional `@gnolith/taproot >=0.4.0 <0.5.0` and `@gnolith/workshop >=0.4.1 <0.5.0` peers. It imports neither package at runtime. Published declarations are Waystone-owned and exact packed-artifact conformance proves bidirectional structural equality with Taproot 0.4.0 and Workshop 0.4.1.

The browser client sends Taproot `SearchRequest` unchanged as JSON in `POST /api/workshop/search` and preserves `sourceId`, string `sourceRevision`, score, snippet, language, generic match data, and cursor from `SearchPage`. Nested filters are never flattened. `searchReference()` provides the discriminated `{kind, sourceId}` reference and `search.hydrate()` resolves it through its owning route.

Taproot Resource and Annotation models retain discriminated payload, body, and target values; one Item linkage; integrity and media type; selectors; attribution; authorization; timestamps; deletion state; and numeric repository revisions. Workshop Prompt models retain name, prompt text, scope, role, variable schema, activation, priority/order, policy and authorization metadata, CRUD, and history events. Adapter validators return the complete input object and do not default, rename, or discard protocol fields.

Search administration is the Workshop 0.4.1 boundary: status uses `GET /api/workshop/search/admin`, and exact bounded `SearchAdministrationOperation` values use `POST /api/workshop/search/admin`.
