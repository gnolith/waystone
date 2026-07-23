# Monorepo handoff

Source ownership:

- `model.ts`: UI projections and the structural Workshop client.
- `workshop-client.ts`: abort-safe named-operation hook and error guard.
- `components.tsx`, `knowledge-components.tsx`: server-safe display UI.
- `client-components.tsx`, `knowledge-client-components.tsx`: interactive named-operation UI.
- `plugin-*`: static validated display extensions.
- `site-components.tsx`: route-free screen composition.
- `test/fixtures/fake-workshop-client.ts`: test-only client.

Consumers must bind an exact Workshop architecture-reset release before publication. Required handoff evidence is its package coordinate, archive SHA-256, integrity, and named-operation catalog digest. Until supplied, the candidate uses catalog digest `51431fef2811f73c9cbe9b30083660a42c091aeb5b6eca952cd89d5bbfd34f61` only in tests.

Candidate artifacts contain the packed tarball, CycloneDX SBOM, immutable CSS asset/manifest, checksums, commit identity, and the unresolved binding field.
