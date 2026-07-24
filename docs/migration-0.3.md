# Migrating to 0.3

Version 0.3 is a breaking architecture reset. Delete endpoint, token, and route configuration passed to Waystone and pass the host-created Workshop client to interactive components.

| Removed Waystone API                                                      | Exact Workshop 0.5 operation                                                                                                                             |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entity search/get/create/update/history                                   | `search`, `get_entity`, `create_item`/`create_property`, `mutate_entity`, `entity_history`                                                               |
| entity revert/archive                                                     | Removed; Workshop 0.5 exposes no such operation                                                                                                          |
| statement add and sitelink set                                            | `mutate_entity`                                                                                                                                          |
| unified search/hydration                                                  | `search`, `search_hydrate`                                                                                                                               |
| resource search/get/create/update/delete/history/payload                  | `search`, `get_resource`, `create_resource`, `update_resource`, `delete_resource`, `resource_history`, `hydrate_resource`                                |
| annotation search/get/create/update/delete/history                        | `search`, `get_annotation`, `create_annotation`, `update_annotation`, `delete_annotation`, `annotation_history`                                          |
| prompt list/get/create/update/delete/history                              | `list_prompts`, `get_prompt`, `create_prompt`, `update_prompt`, `delete_prompt`, `prompt_history`                                                        |
| memory list/get/update/delete/history                                     | `list_memories`, `get_memory`, `upsert_memory`, `delete_memory`, `memory_history`                                                                        |
| task list/get/create/update/claim/release/complete/archive/history/packet | `list_tasks`, `get_task`, `create_task`, `update_task`, `claim_task`, `release_task`, `complete_task`, `archive_task`, `task_history`, `get_task_packet` |
| SPARQL validate/query/cancel                                              | `validate_sparql`, `query_sparql`, cancellation via `AbortSignal`                                                                                        |
| readiness                                                                 | `gnolith_status`                                                                                                                                         |
| search administration                                                     | `search_admin`                                                                                                                                           |

Removed without replacement: client constructors, path maps, route helpers, auth/token storage, transport error classes, canonical DTO adapters, host operations, installation, snapshot/restore, and onboarding flows. Those responsibilities belong to Workshop or the host.

Plugins are now static, validated UI declarations. Remove route, tool, client, authentication, fetch, or server fields; unknown keys are rejected.

Use `EntityLink` with a host-supplied `href` or `onNavigate`. Waystone no longer manufactures entity or property URLs.
