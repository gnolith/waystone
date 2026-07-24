# Monorepo handoff

Source ownership:

- `model.ts`: UI projections and the structural Workshop client.
- `workshop-client.ts`: abort-safe named-operation hook and error guard.
- `components.tsx`, `knowledge-components.tsx`: server-safe display UI.
- `client-components.tsx`, `knowledge-client-components.tsx`: interactive named-operation UI.
- `plugin-*`: static validated display extensions.
- `site-components.tsx`: route-free screen composition.
- `test/fixtures/fake-workshop-client.ts`: test-only client.

The candidate binds `@gnolith/workshop@0.5.0`, commit `66214d4cfb1072ad794e9f2c29acbac06ae52048`, archive SHA-256 `f4b203a4c8606bc732ad4b859249b2d5eb63f8993435cb5f07100d401076e3c8`, schema 11, the 52-operation catalog digest `a57799a792a075a5e359567240a7241a48df4155fae3a9e73b092ccf9035955b`, and the canonical verified asset prefix `/app`.

Candidate artifacts contain the packed tarball, CycloneDX SBOM, immutable CSS asset/manifest, checksums, commit identity, and the unresolved binding field.
