# Troubleshooting

## A request fails

Inspect the Workshop error code and request ID at the host boundary. Waystone redacts secrets and internal diagnostics and does not know endpoints or credentials.

## A link is not interactive

Pass `href` or `onNavigate` to `EntityLink`. The host owns navigation.

## Semantic results are unavailable

Check readiness. Waystone continues to present lexical results and labels semantic degradation.

## A lease action conflicts

Refresh the Task. The owner, revision, or expiry changed. Release is sent as an idempotent owner operation.

## A plugin is rejected

Remove unknown or server-oriented keys and ensure capability IDs are unique lowercase identifiers.
