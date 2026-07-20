# Waystone

**Local MCP connector for reaching Gnolith sites.**

Waystone will let local MCP clients discover, authenticate to, and use the
public capabilities of remote Gnolith sites without importing server
implementations.

## Status

This repository is a private, non-publishable scaffold. It deliberately exposes
no public API or executable yet.

## Intended boundaries

- Own local MCP transport, site discovery, credentials, and connection UX.
- Depend on documented remote protocols rather than server implementation code.
- Keep hosted task execution in [`@gnolith/workshop`](https://github.com/gnolith/workshop).
- Store credentials only through an explicit operating-system or host-provided
  secret facility.

## Development

```sh
npm ci
npm run check
```

## License

MIT
