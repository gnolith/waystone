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

Workshop binding: commit `423f3a75fe4ee197727866be7c9c6667720cd862`, tree `89ebeff9da51511a2de694e1e1fd559143cc16ad`, archive SHA-256 `6d297b644b38aaacabb606521a916013ba61c0c7ebb5a0c7980f304caadefa77`, SBOM SHA-256 `3656f30a0be09cd94d99c1fd5eca0bf807da618d00464500c507a2029a0685eb`.
