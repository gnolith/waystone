# Architecture-reset candidate evidence

Date: 2026-07-23

Version: 0.3.0

Local candidate gate:

- formatting, ESLint, strict TypeScript, build: pass
- root and production dependency audits: zero high/critical
- 26 component/unit tests plus SSR, hydration, accessibility, adversarial security, and coverage gates: pass
- exact packed browser bundle/render consumer: pass
- strict packed TS/TSX declaration consumer across all public entries: pass
- server-safe/runtime graph, tarball, asset/JCS, SBOM, boundary, and bundle budgets: pass
- exact packed `@gnolith/workshop@0.5.0`, schema 11, operation schema 2, 52-operation catalog, and verified `/app` asset mount: pass at digest `af455b4d6ab3560bca9c0ab48e9db7bd3cbcfa166ace875578d88d182069071f`

Repository preflight:

- public GitHub repository: confirmed
- protected `main`, strict required checks, linear history, no force push/deletion, admin enforcement, conversation resolution: confirmed
- secret scanning and push protection: enabled
- dependency updates/review and repository default CodeQL scanning: present
- latest public npm package has provenance attestations

Workshop binding: protected-main commit `66c923f9505359ee7ae92ca48beddd044d2bb036`, tree `fa55f0c8bce7a77945626f177a7759e903d7f59b`, 274551-byte archive SHA-256 `5b266e029201e0eba33d497212b9f80c4b6821731efe289189d547c626f8d44c`, integrity `sha512-4DwTKaR/cObyGvNEUmQ0a7VzRU4oA2Ma5fO4IM2on+B8LOst0bAdeSLZvYqHl7rDblfgZyOG0OFBtlM9AKcnGw==`, SBOM SHA-256 `d5b003a1d0249b593eabf54d1e0c5ac4f3b5279bc2596b1b940cb6413a3d38f4`, inventory SHA-256 `51107a743f2410c0621247df1e1db9cf0e2d6b43e4c4b3c9a91b2c63faa388bb`, and Workshop checksum-manifest SHA-256 `e0741eefd87e3326e2022265b5016a911fc179d3b8485d2241fa465d09c482c3`.
