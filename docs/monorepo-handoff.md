# Monorepo handoff

Source ownership:

- `model.ts`: UI projections and the structural Workshop client.
- `workshop-client.ts`: abort-safe named-operation hook and error guard.
- `components.tsx`, `knowledge-components.tsx`: server-safe display UI.
- `client-components.tsx`, `knowledge-client-components.tsx`: interactive named-operation UI.
- `plugin-*`: static validated display extensions.
- `site-components.tsx`: route-free screen composition.
- `test/fixtures/fake-workshop-client.ts`: test-only client.

The candidate binds `@gnolith/workshop@0.5.0`, commit `13db3690053bea331d341f6f848d2641441ecc0c`, archive SHA-256 `1a59399eb253b7085d581726f3e9314ecbe5c52f4780fb14e43df1af8df484b3`, schema 11, the 52-operation catalog digest `7a66ccb7ed6c5ae33be526a318376b895d2ecb122d7e723fb3117baf8ad66224`, and the canonical verified asset prefix `/app`.

Candidate artifacts contain the packed tarball, CycloneDX SBOM, immutable CSS asset/manifest, checksums, commit identity, and the unresolved binding field.
