# Search and content operations

`UnifiedSearchScreen` calls `search.query` with any combination of the seven result kinds. Scores are ordering signals and are not displayed as percentages. Hidden derived chunks are omitted. Semantic degradation is explicit while lexical results remain usable.

Opening a result calls `search.hydrate`; Waystone does not infer a read operation from its kind. Resource payload previews request a bounded byte count, escape text, refuse active content, and only expose safe `http` or `https` external destinations with isolation attributes.

Search administration is authorization-aware. The host supplies allowed action names and input; Waystone calls those named Workshop operations and renders bounded, redacted status.
