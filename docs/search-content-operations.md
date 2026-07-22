# Search, content, and operations

Waystone consumes one host-provided search capability covering Statement, Item, Task, Memory, Prompt, Resource, and Annotation results. `UnifiedSearchScreen` sends explicit kinds, kind-aware filters, a bounded page size, and an opaque cursor. It displays lexical-only or semantic-augmented readiness from the response. It offers no invented search-mode selector, does not group independently ranked chunks, and only removes an invalid cursor after the user chooses same-query recovery.

Every result shows canonical identity and revision. Optional bounded snippets, language, selectors, and contributing statement IDs render as React text. Result links use the owning canonical route, and `hydrateSearchResult` calls the matching entity, Task, Memory, Prompt, Resource, or Annotation read operation. Resource and Item identities remain labelled and linked separately.

Resources may carry host-returned metadata, integrity, location, body, language, media type, selected excerpts, and linked Item IDs. External locations become links only for HTTP or HTTPS. Durable OCR, transcript, translation, and caption works should be created as Resources and linked to their source with an Annotation. Small text remains an Annotation body. Waystone never dereferences an arbitrary Resource location.

Annotations expose body or body Resource, Resource target, selector, motivation, attribution, language, media type, and inherited visibility. Prompts expose title, text, variables, language, and revision history. Persistence and authorization are always host responsibilities.

`SearchHealthView` presents lexical readiness, semantic configuration/readiness, selected configuration, coverage, pending work, schedules, bounded failures, circuits, and workers. `SearchAdministration` renders controls only when `adminAuthorized` is exactly true in the server response. Cost, token, and duration estimates remain visibly unknown when absent. Budget approval, failure exclusion, configuration retirement, and embedding deletion require confirmation. Diagnostic text is credential-redacted and never rendered as HTML.

`HostOperationsPanel` starts snapshot, export, import, and restore only through the host API and renders returned progress/failure records. Waystone never reads database files, credentials, indexes, or vector stores.
