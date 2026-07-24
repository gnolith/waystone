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
- exact packed `@gnolith/workshop@0.5.0`, schema 9, and 51-operation catalog: pass at digest `577cc1de501b0ae3556eb1d32e7dd516c70a09c5b6226d671cec312068fba3dd`

Repository preflight:

- public GitHub repository: confirmed
- protected `main`, strict required checks, linear history, no force push/deletion, admin enforcement, conversation resolution: confirmed
- secret scanning and push protection: enabled
- dependency updates/review and pinned CodeQL workflows: present
- latest public npm package has provenance attestations

Workshop binding: commit `c2e345c0b287af7c8622e226943af83a11a33ac7`, tree `fbf15a852ee20d4dedabc6cfcb3403bb6419520d`, archive SHA-256 `477ce5b388aa75f4d451555341fbdd7cc74092d90256de2ec6ae054aff019b70`, SBOM SHA-256 `1483b5ff63ab9c74b3bd21fd992149c5c41fd255bce0def06f23c63b3f90d750`.
