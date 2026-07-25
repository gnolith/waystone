# Monorepo handoff

Source ownership:

- `model.ts`: UI projections and the structural Workshop client.
- `workshop-client.ts`: abort-safe named-operation hook and error guard.
- `components.tsx`, `knowledge-components.tsx`: server-safe display UI.
- `client-components.tsx`, `knowledge-client-components.tsx`: interactive named-operation UI.
- `plugin-*`: static validated display extensions.
- `site-components.tsx`: route-free screen composition.
- `test/fixtures/fake-workshop-client.ts`: test-only client.

The candidate binds `@gnolith/workshop@0.5.0`, protected-main commit `66c923f9505359ee7ae92ca48beddd044d2bb036`, tree `fa55f0c8bce7a77945626f177a7759e903d7f59b`, 274551-byte archive SHA-256 `5b266e029201e0eba33d497212b9f80c4b6821731efe289189d547c626f8d44c`, schema 11, operation schema 2, the 52-operation catalog digest `af455b4d6ab3560bca9c0ab48e9db7bd3cbcfa166ace875578d88d182069071f`, and the canonical verified asset prefix `/app`.

Candidate artifacts contain the packed tarball, CycloneDX SBOM, immutable CSS asset/manifest, checksums, commit identity, and the unresolved binding field.
