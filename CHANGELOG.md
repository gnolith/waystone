# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning.

## [Unreleased]

## [0.1.1] - 2026-07-21

### Changed

- Isolated package verification from sibling-repository source trees and legacy Workshop archives.
- Consolidated npm publication behind the protected GitHub Release publication event and added release-candidate guards.
- Adapted Workshop-shaped entity panels from Waystone's canonical `entity` prop to Workshop's `entityId` contract at the registry boundary.
- Clarified that headless and process-based consumers compose non-UI packages without importing Waystone.
- Added a temporary token-authenticated bootstrap path for the package's first npm publication while preserving provenance and OIDC; the credential-bearing step publishes only a preverified staged archive with lifecycle scripts disabled.
- Expanded Taproot compatibility through stable 0.2, moved isolated-consumer archives to unique temporary pack destinations, and separated the recursive consumer install from `prepack`.

### Added

- Production package implementation, explicit runtime entry points, declarations, and compiled CSS.
- Application shell, onboarding, knowledge browsing and maintenance, revision, and SPARQL surfaces.
- Browser-safe client with configurable paths, authentication callback, abort signals, typed errors, request IDs, and optimistic concurrency.
- Deterministic plugin registry and isolated extension rendering.
- Representative fixtures, mutable mock client, component/accessibility tests, package guards, bundle budgets, and an isolated vinext consumer fixture.

## [0.1.0] - 2026-07-20

### Added

- First production-candidate public contract.

[Unreleased]: https://github.com/gnolith/waystone/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/gnolith/waystone/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/gnolith/waystone/releases/tag/v0.1.0
