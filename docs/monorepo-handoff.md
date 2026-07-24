# Monorepo handoff

Source ownership:

- `model.ts`: UI projections and the structural Workshop client.
- `workshop-client.ts`: abort-safe named-operation hook and error guard.
- `components.tsx`, `knowledge-components.tsx`: server-safe display UI.
- `client-components.tsx`, `knowledge-client-components.tsx`: interactive named-operation UI.
- `plugin-*`: static validated display extensions.
- `site-components.tsx`: route-free screen composition.
- `test/fixtures/fake-workshop-client.ts`: test-only client.

The candidate binds `@gnolith/workshop@0.5.0`, commit `1140631d7908920b2dc47d1baf3c729d25a4a409`, archive SHA-256 `6d297b644b38aaacabb606521a916013ba61c0c7ebb5a0c7980f304caadefa77`, schema 11, the 52-operation catalog digest `7a66ccb7ed6c5ae33be526a318376b895d2ecb122d7e723fb3117baf8ad66224`, and the canonical verified asset prefix `/app`.

Candidate artifacts contain the packed tarball, CycloneDX SBOM, immutable CSS asset/manifest, checksums, commit identity, and the unresolved binding field.
