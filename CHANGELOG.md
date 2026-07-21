# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning.

## [Unreleased]

### Changed

- Added mandatory authored text to Waystone and structural Taproot statement revisions. Adapters, HTTP serialization, fixtures, rendering, and mock persistence preserve the text exactly, while mutation editors require a new nonblank confirmation for add, replace, rank, qualifier, and reference changes instead of silently carrying earlier prose.

## [0.1.2] - 2026-07-21

### Fixed

- Added `@types/react` as a required React 19 peer so strict TypeScript consumers receive the declarations referenced by Waystone's public API.
- Replaced public Taproot declaration references with Waystone-owned structural protocol types. Strict `NodeNext` consumers no longer resolve Taproot's Diamond, Comunica, `rdf-parse`, or `lru-cache` declaration graph merely by importing Waystone.

### Changed

- Added exact packed TS and TSX consumer verification on TypeScript 5.9 with `strict: true` and `skipLibCheck: false`, including declaration-resolution and package-content boundary assertions.
- Removed the completed first-release bootstrap-token path. npm releases now use only the protected environment's OIDC trusted-publisher binding.

## [0.1.1] - 2026-07-21

### Changed

- Isolated package verification from sibling-repository source trees and legacy Workshop archives.
- Consolidated npm publication behind the protected GitHub Release publication event and added release-candidate guards.
- Adapted Workshop-shaped entity panels from Waystone's canonical `entity` prop to Workshop's `entityId` contract at the registry boundary.
- Clarified that headless and process-based consumers compose non-UI packages without importing Waystone.
- Added a temporary token-authenticated bootstrap path for the package's first npm publication while preserving provenance and OIDC; a fresh credential-only job has only ID-token permission and publishes a content-addressed archive after validating its paths, literal package identity, and release-tag-derived version without checking out repository code or enabling lifecycle scripts.
- Expanded Taproot compatibility through stable 0.2, moved isolated-consumer archives to unique temporary pack destinations, and separated the recursive consumer install from `prepack`.

### Known limitation

- The published declarations referenced React types without declaring `@types/react` as a peer and re-exported Taproot root types. A strict `NodeNext` consumer with `skipLibCheck: false` could therefore fail on missing React declarations or on Taproot's transitive Diamond/Comunica declaration graph. Version 0.1.2 corrects both package boundaries without changing runtime behavior.

### Added

- Production package implementation, explicit runtime entry points, declarations, and compiled CSS.
- Application shell, onboarding, knowledge browsing and maintenance, revision, and SPARQL surfaces.
- Browser-safe client with configurable paths, authentication callback, abort signals, typed errors, request IDs, and optimistic concurrency.
- Deterministic plugin registry and isolated extension rendering.
- Representative fixtures, mutable mock client, component/accessibility tests, package guards, bundle budgets, and an isolated vinext consumer fixture.

## [0.1.0] - 2026-07-20

### Added

- First production-candidate public contract.

[Unreleased]: https://github.com/gnolith/waystone/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/gnolith/waystone/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/gnolith/waystone/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/gnolith/waystone/releases/tag/v0.1.0
