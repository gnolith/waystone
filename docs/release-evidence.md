# Release evidence

Status: **GO**

Release-candidate evidence recorded on 2026-07-20 for `@gnolith/waystone@0.1.0`.

| Gate                                                  | Evidence                                                                                                                                                                                                                              | Result |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Clean package check                                   | `npm run check` passed formatting, lint, strict TypeScript, 22 unit/component tests, coverage, build, package verification, bundle budgets, and the fresh-consumer check.                                                             | Pass   |
| Public exports and declarations                       | Package verification imported every public entry point, resolved declarations and compiled CSS, checked export targets, and rejected client/server boundary violations.                                                               | Pass   |
| Exact tarball and fresh consumer                      | `npm pack` contents passed the allowlist; the exact `gnolith-waystone-0.1.0.tgz` was installed into an isolated copy of the canary and used without workspace aliases.                                                                | Pass   |
| vinext/Vite production build and SSR                  | The fresh consumer built all application and API routes. Seven rendered-HTML tests passed for `/`, onboarding, browse, entity, property, SPARQL, and the real Workshop UI plugin.                                                     | Pass   |
| Worker deployment without Node compatibility          | Sites version `appgprj_6a5ebc36cbb88191ae4e84554992b4ef~appgver_b8eb01cdcef881918a1a601e76f36325` deployed successfully with empty production compatibility flags.                                                                    | Pass   |
| Live Taproot browse, revision, mutation, and conflict | The deployed API read Q2 at revision 1, accepted an `If-Match` mutation to revision 2, returned the two-revision history, and rejected the stale revision with the expected 409 conflict. Search returned three live entities.        | Pass   |
| Live SPARQL validate, dry run, and query              | Deployed validation succeeded; dry-run returned two rows; the Diamond/Comunica-backed query returned two `bindings` rows.                                                                                                             | Pass   |
| Workshop public-contract integration                  | The canary installs a packed `@gnolith/workshop@0.1.0` artifact, imports only `@gnolith/workshop/ui`, registers `workshopPlugin`, and renders its Tasks, Memories, and entity-panel contributions. Waystone does not import Workshop. | Pass   |
| Server rendering and client hydration                 | Deployed SSR rendered the authenticated canary through a private-site bypass. Local browser verification exercised live hydration after the same production build and displayed Q2 revision 2 and the saved description.              | Pass   |
| Browser console and Worker logs                       | Browser smoke produced no material console errors. The final error-only Worker-log query contained only the intentionally induced stale-write 409; its Worker outcome was `ok` and no exception was recorded.                         | Pass   |
| Documentation                                         | README and the API-client, plugin, styling, accessibility, Sites, release, troubleshooting, upgrade, and Taproot dependency guides match the 0.1.0 public contract.                                                                   | Pass   |

Private production canary: <https://gnolith-waystone-canary.kcsfelty.chatgpt.site>

The canary is protected by Sign in with ChatGPT. Direct unattended browser access
therefore stops at the expected access screen; authenticated production SSR was
verified through the private-site bypass, while live browser hydration and all
production API behaviors were verified separately.

Observed package bundle sizes (minified ESM, React external): server-safe root
8,152 bytes; client shell 3,969 bytes; SPARQL editor 5,385 bytes; entity editor
7,727 bytes. All are below the documented budgets.
