# Components and workflows

The root entry contains server-safe static rendering: shell primitives, entity summaries and metadata, statement groups, all required snak values and ranks, qualifiers, references, revision lists/viewers/diffs, seven-kind search results, Resource/Annotation/Prompt views, search health, host-operation progress, result tables, ASK/RDF results, and loading, empty, permission, network, and public error states.

The client entry contains browser workflows: keyboard entity search, create Item/Property, text and alias maintenance, sitelinks, full statement documents with qualifiers and references, rank and statement removal, redirects, soft deletion, revision reversion, and SPARQL validation/dry-run/query/abort/copy/download. Every add, replacement, rank, qualifier, or reference revision visibly requires newly authored nonblank statement text; selecting an existing statement never pre-fills that confirmation. Statement removal is exempt.

The site entry composes generated routes with the existing pages plus `SearchPage`, `ResourcePage`, `AnnotationPage`, `PromptPage`, `SearchOperationsPage`, and `SiteDataOperationsPage`. These accept host-fetched records and clients; they initialize no server behavior.

The client entry also includes unified search and hydration, Resource/Annotation/Prompt editors, exact-admin search controls, and host-operation launch/progress. Budget-bearing or destructive administration actions are explicit and server authorization remains authoritative.

All mutations use the client’s expected-revision contract. Client capability props determine whether controls are offered, but the Site API remains authoritative and rejection is always displayed.
