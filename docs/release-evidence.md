# Historical package release evidence: 0.1.2

Status at capture: **PACKAGE CHECKS PASSED; 0.1.2 CANDIDATE WAS NOT YET TAGGED OR PUBLISHED**

> This is an immutable pre-publication snapshot retained for the 0.1.2 audit trail. It does not describe the current development branch, test count, peer floors, or package archive. Current compatibility is defined by [Taproot and Workshop protocol boundary](taproot-dependencies.md), [Upgrade policy](upgrades.md), the package manifest, and the latest successful `npm run check`.

This file records historical evidence attributable to the 0.1.2 `@gnolith/waystone` candidate. It does not qualify assembly, provisioning, deployment, or acceptance of a complete Gnolith Site.

Package-owned evidence refreshed locally on 2026-07-21 for the `0.1.2` candidate:

- Node `v24.14.0` and npm `11.9.0`.
- `npm run check` passed formatting, ESLint, strict repository typechecking, all 23 unit/component/adapter/plugin/conflict/accessibility tests, configured coverage thresholds, declarations/CSS build, package verification, package boundaries, bundle budgets, exact-archive vinext acceptance, and strict declaration-consumer acceptance.
- The existing exact-archive consumer installed the candidate into a fresh temporary project, completed its vinext/Vite build, and passed all seven SSR and fixture-plugin tests.
- A second fresh consumer installed the exact candidate plus every declared peer: public Taproot `0.2.0`, `@types/react 19.2.14`, React `19.2.6`, and React DOM `19.2.6`. Representative `.ts` and `.tsx` imports compiled with TypeScript `5.9.3`, `NodeNext`, `strict: true`, and `skipLibCheck: false`.
- Declaration-resolution output and every declaration/declaration-map in the installed candidate were inspected. Importing Waystone did not resolve or reference Taproot, Diamond, Comunica, `rdf-parse`, or `lru-cache` declarations.
- Repository adapter tests continue to type canonical fixtures with public `@gnolith/taproot@0.2.0`, preserving the runtime/API compatibility covered by 0.1.1 while the emitted package declarations use local structural protocol types.
- `@types/react` is a required peer at `>=19 <20` and the development dependency is pinned exactly to `19.2.14` in the manifest and lock.
- The isolated consumer's production-dependency audit and the repository audit reported zero vulnerabilities.
- Bundle checks passed with React external: base server-safe import 8,152/45,000 bytes, base client shell 3,969/30,000, SPARQL editor 5,385/25,000, and entity editor 7,727/35,000.
- Exact local archive `gnolith-waystone-0.1.2.tgz`: 88 files, 65,889 bytes packed and 296,677 bytes unpacked; SHA-256 `ef8d4d36b1967704d1ff7f5792448186030c0c582bc8fd61cd9aa427960530a7`; npm shasum `177231cfe8e04ace28c3d5615df55831c2b98eca`; integrity `sha512-k8CuG1hOZHImCWg//DkLx2J3ZFzF8DofR3qK3fbQZLx6aWtZCkYrB+HeDnQxEXei5avBkCwDLMuD9okpH4wgkw==`.
- `npm run release:check -- v0.1.2` passed version, changelog, exact-consumer archive metadata, immutable `v0.1.0` and `v0.1.1` tags, the single GitHub Release trigger, pinned artifact transfer, hostile archive-path rejection, literal name and tag-derived version checks, and the isolated fresh-runner publication contract. The `v0.1.2` tag is intentionally absent.
- The token-free `stage` job runs the complete package gate, stages and dry-run-verifies the exact archive, binds its filename to version and SHA-256, and transfers it with pinned GitHub artifact actions.
- The protected `publish` job has no checkout or repository execution, grants only `id-token: write`, downloads and revalidates the content-addressed archive, and ends with the sole `npm publish` command. The workflow contains no registry token, GitHub secret, or bootstrap-token reference; npm trusted publishing is the sole authentication path.

## 0.1.1 limitation

The published 0.1.1 package works at runtime, but its declarations referenced React types without declaring `@types/react` as a peer and re-exported Taproot root types. A strict TypeScript 5.9 `NodeNext` consumer using `skipLibCheck: false` could fail on missing React declarations or in Taproot's transitive Diamond/Comunica/`rdf-parse`/`lru-cache` declarations. Candidate 0.1.2 corrects both declaration-package boundaries without changing adapter runtime behavior.

## Historical package evidence boundaries

| Gate                            | Evidence captured for the 0.1.2 candidate                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Clean package check             | `npm run check` passed locally with the toolchain and coverage counts above.                                                               |
| Public exports and declarations | Every public entry resolves; exact packed TS and TSX consumers pass strict TypeScript without resolving forbidden transitive declarations. |
| Exact tarball                   | Filename, size, file count, SHA-256, shasum, integrity, and allowlisted contents are recorded above.                                       |
| Isolated consumer build and SSR | Exact archive built representative routes and passed seven server-rendered acceptance tests.                                               |
| Bundle budgets                  | All four documented minified ESM budgets pass with React external.                                                                         |
| Publication path                | GitHub Release event only; token-free staging and OIDC-only fresh protected publisher job.                                                 |

The Codex agent creating a complete Site owns sibling-package selection, generated routes, project identity, provisioning, bindings, migrations, compatibility flags, deployment, authentication, live persistence/SPARQL behavior, browser state, logs, request IDs, URLs, and host GO/NO-GO.
