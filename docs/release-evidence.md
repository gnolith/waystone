# Package release evidence

Status: **PACKAGE CHECKS PASS**

This file records evidence attributable to the published `@gnolith/waystone` package. Refresh it from a clean release candidate before publishing.

Package-owned evidence refreshed locally on 2026-07-21 for the `0.1.1` candidate:

- Node `v24.14.0` and npm `11.9.0`.
- ESLint and strict TypeScript passed.
- All 22 unit, component, adapter, plugin, conflict, and accessibility tests passed with coverage above the configured thresholds.
- Public export, declaration, CSS, runtime-graph, tarball allowlist, React-external, and bundle-budget checks passed.
- The exact archive installed into a fresh temporary consumer; its vinext build completed and all seven SSR and fixture-plugin tests passed.
- Package-boundary checks confirmed that tracked source and archives are Waystone-owned; the isolated consumer uses only the exact `0.1.1` archive and public package exports.
- Archive `gnolith-waystone-0.1.1.tgz`: shasum `d2e12f67885e2ca8561034a66b277fef271028b2`; integrity `sha512-iPlxFRVFYmUn8rsMEIvqXuGHH/qIRpLqrtYj4guQfjEzleuNpFi1CIxdrsU3mXaimX4qO13MktAMo9sgKn49Ug==`.
- Production-dependency audit for the isolated consumer reported zero vulnerabilities.
- `npm run release:check -- v0.1.1` verified version, changelog, exact-consumer archive, immutable `v0.1.0`, and the single GitHub Release publication trigger. The `v0.1.1` tag remains intentionally absent pending release authorization.
- The GitHub `npm` environment exists with OIDC enabled in the workflow and no npm token secret. GitHub currently reports no environment approval or branch/tag protection rules; add an approval rule before publication if organizational policy requires one. The external npm trusted-publisher binding is not observable from repository configuration and must be confirmed before publication.

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
