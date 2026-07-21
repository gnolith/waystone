# Package release evidence

Status: **PACKAGE CHECKS PASS**

This file records evidence attributable to the published `@gnolith/waystone` package. Refresh it from a clean release candidate before publishing.

Package-owned evidence refreshed locally on 2026-07-20:

- Node `v24.14.0` and npm `11.9.0`.
- ESLint and strict TypeScript passed.
- All 22 unit, component, adapter, plugin, conflict, and accessibility tests passed with coverage above the configured thresholds.
- Public export, declaration, CSS, runtime-graph, tarball allowlist, React-external, and bundle-budget checks passed.
- The exact archive installed into a fresh temporary consumer; its vinext build completed and all seven SSR and fixture-plugin tests passed.
- Archive `gnolith-waystone-0.1.0.tgz`: shasum `580223e678fbd12edc75b378ae38f93d6ba7c93e`; integrity `sha512-tQ0LJJkWhLy7A0iXv1pJJtOKeJJs8uYW6qf30llU3bnkuVgQ++y9oFEex7btR1QSeOPJho21/+Y1ibc1+m1nZA==`.
- Production-dependency audit for the isolated consumer reported zero vulnerabilities.

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
