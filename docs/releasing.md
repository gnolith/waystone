# Release checklist

Waystone is `NO-GO` unless every package-owned mandatory item has current evidence.

- Clean checkout: `npm ci && npm run check`
- Run `npm run release:check -- vX.Y.Z` for the exact candidate tag
- Version and changelog agree; repository, issue, license, peer, engine, and public-access metadata are correct
- Every public export and declaration resolves; CSS resolves; root cannot reach client modules
- Unit, component, accessibility, conflict, plugin, package, and consumer tests pass
- Bundle budgets pass and React is external
- `npm pack --json` contains only intended artifacts and provenance is enabled
- Install the exact tarball into a fresh isolated consumer, then build and server-render it with vinext/Vite
- Exercise the Workshop-shaped fixture through only `@gnolith/waystone/plugin`; do not introduce a Workshop dependency
- Record package commands, versions, package integrity, consumer build, and SSR results in `docs/release-evidence.md`
- After authorization, create a new immutable `vX.Y.Z` tag at the verified merge commit; never move or reuse an existing version tag
- Publish a GitHub Release for that exact tag. The protected `npm` environment and trusted-publishing workflow run only from the `release: published` event; pushing a tag does not publish npm
- Verify installation from the registry after the single publication workflow succeeds

If a package-owned line is unavailable or unproven, preserve `NO-GO` and name the dependency rather than substituting fixtures.

This checklist qualifies the published Waystone package. The Codex agent creating a complete Site owns sibling-package selection, generated routes, provisioning, bindings, migrations, compatibility flags, deployment, live D1 and SPARQL behavior, authentication, browser checks, logs, and host GO/NO-GO.
