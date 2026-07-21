# Release checklist

Waystone is `NO-GO` unless every mandatory item has current evidence.

- Clean checkout: `npm ci && npm run check`
- Version and changelog agree; repository, issue, license, peer, engine, and public-access metadata are correct
- Every public export and declaration resolves; CSS resolves; root cannot reach client modules
- Unit, component, accessibility, conflict, plugin, package, and consumer tests pass
- Bundle budgets pass and React is external
- `npm pack --json` contains only intended artifacts and provenance is enabled
- Install the exact tarball into a fresh canary, then type-check and build it with vinext/Vite
- Deploy the Worker without a Node compatibility flag
- Browser-smoke every required route; inspect console and Worker logs
- Run entity browse, history, successful mutation, stale-revision conflict, and SPARQL validate/dry-run/query against live Taproot APIs
- Register a Workshop build through only `@gnolith/waystone/plugin`
- Record commands, versions, package integrity, deployment URL, request IDs, browser result, and Worker result in `docs/release-evidence.md`
- Publish only from the verified clean commit through npm trusted publishing, then verify installation from the registry

If a line is unavailable or unproven, preserve `NO-GO` and name the dependency rather than substituting fixtures.
