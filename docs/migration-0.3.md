# Migrating to 0.3

Version 0.3 is a breaking architecture reset. Delete endpoint, token, and route configuration passed to Waystone and pass the host-created Workshop client to interactive components.

| Removed Waystone API                                                      | Workshop operation                                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| entity search/get/create/update/history/revert/archive                    | `knowledge.entity.search/get/create/update/history/revert/archive`              |
| statement add                                                             | `knowledge.statement.add`                                                       |
| sitelink set                                                              | `knowledge.sitelink.set`                                                        |
| unified search/hydration                                                  | `search.query`, `search.hydrate`                                                |
| resource list/get/create/update/delete/history/payload                    | `resource.list/get/create/update/delete/history/payload.get`                    |
| annotation list/get/create/update/delete/history                          | `annotation.list/get/create/update/delete/history`                              |
| prompt list/get/create/update/delete/history                              | `prompt.list/get/create/update/delete/history`                                  |
| memory list/get/update/delete/history                                     | `memory.list/get/update/delete/history`                                         |
| task list/get/create/update/claim/release/complete/archive/history/packet | `task.list/get/create/update/claim/release/complete/archive/history/packet.get` |
| SPARQL validate/query/cancel                                              | `sparql.validate`, `sparql.query`, cancellation via `AbortSignal`               |
| readiness                                                                 | `installation.readiness`                                                        |
| search administration                                                     | `search.admin.inspect`, `search.admin.execute`                                  |

Removed without replacement: client constructors, path maps, route helpers, auth/token storage, transport error classes, canonical DTO adapters, host operations, installation, snapshot/restore, and onboarding flows. Those responsibilities belong to Workshop or the host.

Plugins are now static, validated UI declarations. Remove route, tool, client, authentication, fetch, or server fields; unknown keys are rejected.

Use `EntityLink` with a host-supplied `href` or `onNavigate`. Waystone no longer manufactures entity or property URLs.
