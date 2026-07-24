# Monorepo handoff

Source ownership:

- `model.ts`: UI projections and the structural Workshop client.
- `workshop-client.ts`: abort-safe named-operation hook and error guard.
- `components.tsx`, `knowledge-components.tsx`: server-safe display UI.
- `client-components.tsx`, `knowledge-client-components.tsx`: interactive named-operation UI.
- `plugin-*`: static validated display extensions.
- `site-components.tsx`: route-free screen composition.
- `test/fixtures/fake-workshop-client.ts`: test-only client.

The candidate binds `@gnolith/workshop@0.5.0`, commit `c2e345c0b287af7c8622e226943af83a11a33ac7`, archive SHA-256 `477ce5b388aa75f4d451555341fbdd7cc74092d90256de2ec6ae054aff019b70`, schema 9, and catalog digest `577cc1de501b0ae3556eb1d32e7dd516c70a09c5b6226d671cec312068fba3dd`.

Candidate artifacts contain the packed tarball, CycloneDX SBOM, immutable CSS asset/manifest, checksums, commit identity, and the unresolved binding field.
