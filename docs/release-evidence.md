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

Workshop binding: commit `1140631d7908920b2dc47d1baf3c729d25a4a409`, tree `4857f2d941a64a1d26af2a12383066149edbd3fe`, archive SHA-256 `6d297b644b38aaacabb606521a916013ba61c0c7ebb5a0c7980f304caadefa77`, SBOM SHA-256 `cf86bf498124f0bf9a2a37ea1c22c4a13b0d9e299d9673bd55ff79e0959cdae4`.
