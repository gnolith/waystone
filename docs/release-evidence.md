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
- dependency updates/review and pinned CodeQL workflows: present
- latest public npm package has provenance attestations

Workshop binding: protected-main commit `10ce0e1ae441094b28e61ad2772e10e1b391a464`, tree `9e4cd3270b38c89acdebac6b592862692e3c75d2`, 273978-byte archive SHA-256 `6479db87d6c2529b4a5c9e5063cc705f8f2aa3057ae4c7d5a0668e36e48163e4`, integrity `sha512-Z0EKHsceaZsDCwcwjVZm75uUeosRj7V1WPTPVejqToRNjepITYbGWYb5KKozVDTKmOTJS70NkxM6cZZIFGQLsQ==`, SBOM SHA-256 `27aef7d6ae4a0b82a044bfde2d055d32380928dedc08428c9ffeed77574b8658`, inventory SHA-256 `b586c25337a5b5035ef4eaab80efe043ac728c970f1109327d17ad8be1e40d90`, and Workshop checksum-manifest SHA-256 `bd4650b53f23e5ea468a84acedc7d0ce7a92c25eb7a46f2af4a05c96be94d29f`.
