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
- exact packed `@gnolith/workshop@0.5.0`, schema 11, operation schema 2, 52-operation catalog, and verified `/app` asset mount: pass at digest `a57799a792a075a5e359567240a7241a48df4155fae3a9e73b092ccf9035955b`

Repository preflight:

- public GitHub repository: confirmed
- protected `main`, strict required checks, linear history, no force push/deletion, admin enforcement, conversation resolution: confirmed
- secret scanning and push protection: enabled
- dependency updates/review and pinned CodeQL workflows: present
- latest public npm package has provenance attestations

Workshop binding: commit `abbdb1c3f07d8466883c9f00ad3927c81ca78769`, tree `cff0dc55ebd2793ef5b64cc08ecdaad1a52ef6b1`, archive SHA-256 `6d466fa1f91ba93efe070dada9ad8b1e14bde6b4d9cc7e94bdefcb3f25fe95d4`, SBOM SHA-256 `2703fa8ab37439b8fdac1d624bd2b57d0d325ef48b8b87847fb9f50b8b586b68`.
