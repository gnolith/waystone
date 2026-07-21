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
- Install every declared peer into a second clean consumer and compile representative TS and TSX imports with TypeScript 5.9, `NodeNext`, `strict: true`, and `skipLibCheck: false`; assert that Waystone declarations do not resolve Taproot, Diamond, Comunica, `rdf-parse`, or `lru-cache`
- `prepack` runs the non-recursive package gate; the release workflow's preceding full `npm run check` owns exact-archive consumer verification so npm does not recursively pack itself
- Exercise the Workshop-shaped fixture through only `@gnolith/waystone/plugin`; do not introduce a Workshop dependency
- Record package commands, versions, package integrity, consumer build, and SSR results in `docs/release-evidence.md`
- After authorization, create a new immutable `vX.Y.Z` tag at the verified merge commit; never move or reuse an existing version tag
- The token-free `stage` job runs the full package check, stages and dry-run-verifies the exact tarball, names it with its SHA-256 digest, and uploads it with expected archive and digest outputs.
- A fresh protected `publish` job depends on `stage`, grants only `id-token: write`, does not check out or execute repository code, receives no ambient repository-content, Actions, package, or registry-token permission, and authenticates through npm trusted publishing for this repository, workflow, and environment.
- The protected job binds the expected name literally to `@gnolith/waystone` and derives the expected stable version directly from a strictly validated `github.event.release.tag_name`; it does not trust stage-provided identity metadata.
- Before reading `package/package.json`, the protected job rejects a non-regular or linked tarball and rejects archive members with absolute paths, dot/traversal components, backslashes, control characters or newline ambiguity, paths outside `package/`, duplicate paths, symlinks, or any non-regular type. It requires exactly one regular `package/package.json`, then immediately revalidates filename, SHA-256 digest, package name, and version.
- The final step publishes only the revalidated absolute tarball path with `--ignore-scripts`; OIDC is the sole registry authentication path and package lifecycle code cannot run with registry credentials.
- Publish a GitHub Release for that exact tag. The protected `npm` environment workflow runs only from the `release: published` event; pushing a tag does not publish npm.
- Verify installation from the registry after the single publication workflow succeeds

If a package-owned line is unavailable or unproven, preserve `NO-GO` and name the dependency rather than substituting fixtures.

This checklist qualifies the published Waystone package. The Codex agent creating a complete Site owns sibling-package selection, generated routes, provisioning, bindings, migrations, compatibility flags, deployment, live D1 and SPARQL behavior, authentication, browser checks, logs, and host GO/NO-GO.
