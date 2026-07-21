# Components and workflows

The root entry contains server-safe static rendering: shell primitives, entity summaries and metadata, statement groups, all required snak values and ranks, qualifiers, references, revision lists/viewers/diffs, result tables, ASK/RDF results, and loading, empty, permission, network, and public error states.

The client entry contains browser workflows: keyboard entity search, create Item/Property, text and alias maintenance, sitelinks, full statement documents with qualifiers and references, rank and statement removal, redirects, soft deletion, revision reversion, and SPARQL validation/dry-run/query/abort/copy/download.

The site entry composes generated routes with `GnolithShell`, `GnolithHome`, `GnolithEmptyState`, `GnolithOnboarding`, `GnolithEntityPage`, `GnolithPropertyPage`, and `SparqlPage`. Onboarding returns collected values to the host; it performs no persistence.

All mutations use the client’s expected-revision contract. Client capability props determine whether controls are offered, but the Site API remains authoritative and rejection is always displayed.
