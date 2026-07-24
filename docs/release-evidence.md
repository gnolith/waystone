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

Workshop binding: commit `66214d4cfb1072ad794e9f2c29acbac06ae52048`, tree `f19e06d748acf98cdd79d7892544fca2dd76289a`, archive SHA-256 `f4b203a4c8606bc732ad4b859249b2d5eb63f8993435cb5f07100d401076e3c8`, SBOM SHA-256 `47a06c39bb301bb5718f48e6ba58f5639afc383de736b663fd47130438f52c3c`.
