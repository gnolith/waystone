# Workshop dependency

Waystone imports the generated `WorkshopClient`, `OperationName`, and error types from exact `@gnolith/workshop@0.5.0`. Tests install the reviewed packed archive and verify its 52-operation catalog, schema identity, integrity, SHA-256, and canonical `/app` asset mount before exercising UI calls.

Workshop is an exact optional peer and has no runtime import in Waystone's browser output. Server, transport, credentials, and protocol implementation stay outside Waystone.
