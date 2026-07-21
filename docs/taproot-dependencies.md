# Taproot dependency record

As of 2026-07-20, `@gnolith/taproot` is a private `0.0.0` scaffold with no public model/protocol exports or generated HTTP APIs. Waystone therefore defines a structural pre-1.0 protocol boundary and complete UI boundary, but cannot truthfully verify live entity browsing, live mutation/conflict behavior, revision history, or Taproot projection compatibility.

Before Waystone is production `GO`:

1. Taproot publishes browser-safe entity, search, revision, mutation, validation, and error types.
2. Waystone replaces or proves structural identity for its temporary protocol models and declares the supported Taproot range.
3. Generated Site handlers are installed in the canary and all client methods run against them.
4. A real entity mutation and deliberately stale expected-revision mutation prove success and conflict behavior.
5. SPARQL validation, dry run, and query run against the live Site APIs.

No mock result is accepted as evidence for these live gates.
