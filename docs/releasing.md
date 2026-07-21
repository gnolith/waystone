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
- `prepack` runs the non-recursive package gate; the release workflow's preceding full `npm run check` owns exact-archive consumer verification so npm does not recursively pack itself
- Exercise the Workshop-shaped fixture through only `@gnolith/waystone/plugin`; do not introduce a Workshop dependency
- Record package commands, versions, package integrity, consumer build, and SSR results in `docs/release-evidence.md`
- After authorization, create a new immutable `vX.Y.Z` tag at the verified merge commit; never move or reuse an existing version tag
- For the first publication only, store a short-lived npm automation token as the protected `npm` environment secret `NPM_BOOTSTRAP_TOKEN`. The workflow retains OIDC and `--provenance`, so the bootstrap publication includes provenance.
- The token-free `stage` job runs the full package check, stages and dry-run-verifies the exact tarball, names it with its SHA-256 digest, and uploads it with expected digest/name/version outputs.
- A fresh protected `publish` job depends on `stage`, does not check out or execute repository code, downloads only the content-addressed artifact, rejects symlinks and non-regular archive members, and immediately revalidates its filename, SHA-256 digest, package name, and version.
- Only the final publish step receives the bootstrap token. It publishes the revalidated absolute tarball path with `--ignore-scripts`, so package lifecycle code cannot run with registry credentials.
- Publish a GitHub Release for that exact tag. The protected `npm` environment workflow runs only from the `release: published` event; pushing a tag does not publish npm.
- Immediately after the first publication, bind npm trusted publishing to `gnolith/waystone`, `.github/workflows/release.yml`, and the `npm` environment; then remove the bootstrap secret and its `NODE_AUTH_TOKEN` workflow reference.
- Verify installation from the registry after the single publication workflow succeeds

If a package-owned line is unavailable or unproven, preserve `NO-GO` and name the dependency rather than substituting fixtures.

This checklist qualifies the published Waystone package. The Codex agent creating a complete Site owns sibling-package selection, generated routes, provisioning, bindings, migrations, compatibility flags, deployment, live D1 and SPARQL behavior, authentication, browser checks, logs, and host GO/NO-GO.
