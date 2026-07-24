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
- exact packed `@gnolith/workshop@0.5.0`, schema 11, operation schema 2, 52-operation catalog, and verified `/app` asset mount: pass at digest `7a66ccb7ed6c5ae33be526a318376b895d2ecb122d7e723fb3117baf8ad66224`

Repository preflight:

- public GitHub repository: confirmed
- protected `main`, strict required checks, linear history, no force push/deletion, admin enforcement, conversation resolution: confirmed
- secret scanning and push protection: enabled
- dependency updates/review and pinned CodeQL workflows: present
- latest public npm package has provenance attestations

Workshop binding: commit `13db3690053bea331d341f6f848d2641441ecc0c`, tree `fd9078f4c5a66904965cf9dc003431362a403b96`, archive SHA-256 `1a59399eb253b7085d581726f3e9314ecbe5c52f4780fb14e43df1af8df484b3`, SBOM SHA-256 `1e8d9adf76644a82c0bfa5ee07e30ff4fa418ebad4bf564b3b60077b3c7d4b0e`.
