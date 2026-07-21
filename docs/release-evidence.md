# Release evidence

Status: **NO-GO**

Release-candidate evidence recorded on 2026-07-20. The package remains a
mandatory `NO-GO`: Taproot and Workshop do not yet provide publishable live
consumers against which to prove the final integration gates.

| Gate                                                    | Evidence                                                                                                                                                                                                | Result                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Clean package check                                     | `npm run check`: format, lint, strict TypeScript, 17 tests, coverage, build, package checks, budgets, and consumer checks                                                                               | Pass pending clean-checkout replay |
| Exact tarball integrity and contents                    | `npm pack` allowlist inspection; exact tarball installed in the fresh consumer and deployed canary                                                                                                      | Pass                               |
| Fresh vinext/Vite consumer build                        | Fresh temporary consumer installed the tarball, built vinext, and server-rendered all six required routes                                                                                               | Pass                               |
| Cloudflare Worker deployment without Node compatibility | The private production canary deploys successfully from its self-contained tarball; production compatibility flags are empty                                                                            | Pass                               |
| Browser routes, console, and Worker logs                | Local browser exercised search and SPARQL; all deployed routes returned 200 through the private-site bypass; zero Worker error events. Private SIWC prevents direct deployed in-app-browser automation. | Partial / NO-GO                    |
| Live Taproot browse, revision, mutation, and conflict   | Blocked by unpublished Taproot protocol/APIs                                                                                                                                                            | NO-GO                              |
| Live SPARQL validate, dry run, and query                | Fixture-backed UI flow passes; generated live Site API unavailable                                                                                                                                      | NO-GO                              |
| Workshop public-contract integration                    | Dummy and Workshop-shaped fixtures pass; publishable Workshop consumer unavailable                                                                                                                      | NO-GO                              |

Private canary: <https://gnolith-waystone-canary.kcsfelty.chatgpt.site>

Observed package bundle sizes (minified ESM, React external): server-safe root
8,152 bytes; client shell 3,969 bytes; SPARQL editor 5,385 bytes; entity editor
7,727 bytes. All are below the documented budgets.

Do not change this status to `GO` until every row links to authoritative output from the exact publishable tarball.
