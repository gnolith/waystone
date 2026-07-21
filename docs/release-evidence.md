# Package release evidence

Status: **PACKAGE CHECKS PASS; TEMPORARY BOOTSTRAP SECRET INSTALLED**

This file records evidence attributable to the published `@gnolith/waystone` package. Refresh it from a clean release candidate before publishing.

Package-owned evidence refreshed locally on 2026-07-21 for the `0.1.1` candidate:

- Node `v24.14.0` and npm `11.9.0`.
- ESLint and strict TypeScript passed.
- All 23 unit, component, adapter, plugin, conflict, and accessibility tests passed with coverage above the configured thresholds.
- Public export, declaration, CSS, runtime-graph, tarball allowlist, React-external, and bundle-budget checks passed.
- The exact archive installed into a fresh temporary consumer; its vinext build completed and all seven SSR and fixture-plugin tests passed.
- Package-boundary checks confirmed that tracked source and archives are Waystone-owned; the isolated consumer uses only the exact `0.1.1` archive and public package exports. The archive is created under a unique temporary destination and renamed before installation, so `npm pack --dry-run` can safely execute its non-recursive `prepack` gate.
- The root lock resolves development verification to public `@gnolith/taproot@0.2.0`; the supported peer range is `>=0.1.0-rc.0 <0.3.0`, and the exact archive's isolated-consumer lock records that range.
- Archive `gnolith-waystone-0.1.1.tgz`: 84 files, 62,676 bytes; SHA-256 `f86fc60791a3f46845ccf69befdfeec87383d967e83f829fcdf5cfcf4f129e53`; npm shasum `df6d2559ea886c8b0dd35f8851d16343a6750ee2`; integrity `sha512-qOZTxWz6hVeJX/OFAKpVE0ODiTKcsMofNU7Ky+qW+dD0K0D1o14322ecQyInrzr9qSRxd2kmNCWojoCtufTPGA==`.
- Production-dependency audit for the isolated consumer reported zero vulnerabilities.
- `npm run release:check -- v0.1.1` verified version, changelog, exact-consumer archive, immutable `v0.1.0`, the single GitHub Release publication trigger, provenance/OIDC permissions, pinned artifact transfer actions, fresh-job dependency, lifecycle-script suppression, no checkout or repository-script execution in the protected job, and the sole temporary bootstrap-token reference. The `v0.1.1` tag remains intentionally absent pending release authorization.
- The protected GitHub `npm` environment disables administrator bypass and admits only stable `vX.Y.Z` tags. GitHub environment metadata confirms that the short-lived `NPM_BOOTSTRAP_TOKEN` secret is installed. Its value was not read or exposed.
- After the full token-free check, the `stage` job creates the exact publication tarball with `npm pack --ignore-scripts`, verifies it with a token-free `npm publish --dry-run --ignore-scripts`, names it with its SHA-256 digest, and uploads it through the pinned GitHub artifact action with expected digest/name/version outputs.
- A fresh protected `publish` job has no checkout and executes no repository or lifecycle code. It downloads the content-addressed tarball through the pinned artifact action, rejects symlinks and non-regular entries, then revalidates the filename, SHA-256 digest, package name, and version before producing an absolute path. Only its final step receives `NODE_AUTH_TOKEN`, and that step only publishes the revalidated absolute tarball with `--ignore-scripts --access public --provenance`.
- `@gnolith/waystone` does not yet exist on npm. After this first token-authenticated publication creates it, configure npm trusted publishing for repository `gnolith/waystone`, workflow `release.yml`, and environment `npm`; then remove both the environment secret and temporary workflow reference.

The full `npm run check` command passed on the Windows verification checkout after the repository's LF policy was made explicit for Markdown, JSON, and YAML files.

| Gate                            | Required evidence                                                                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean package check             | Commit, Node/npm versions, and successful `npm ci && npm run check` output covering formatting, lint, strict TypeScript, unit/component/accessibility tests, coverage, build, package verification, bundle budgets, and the isolated consumer. |
| Public exports and declarations | Every public entry point imports, declarations and compiled CSS resolve, the server-safe root cannot reach client modules, and runtime graphs contain no Node or Cloudflare imports.                                                           |
| Exact tarball                   | Package filename, version, shasum and integrity from `npm pack --json`, plus the verified tarball allowlist.                                                                                                                                   |
| Isolated consumer build and SSR | The exact archive installs into a fresh temporary consumer with no workspace alias; representative routes build and server-render through public exports using the package mock client and fixture plugin.                                     |
| Bundle budgets                  | Minified ESM sizes with React external and all documented budgets passing.                                                                                                                                                                     |
| Documentation                   | Public API, styling, accessibility, integration, release, troubleshooting, upgrade, and Taproot dependency guides match the package contract.                                                                                                  |

This repository does not record or gate on a complete Site's project identity, package assembly, provisioning, bindings, migrations, compatibility flags, deployment, authentication, live D1 or SPARQL behavior, browser state, logs, request IDs, URLs, or host acceptance. The Codex agent creating the Site owns that run evidence.
