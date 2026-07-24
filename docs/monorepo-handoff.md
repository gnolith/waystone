# Monorepo handoff

Source ownership:

- `model.ts`: UI projections and the structural Workshop client.
- `workshop-client.ts`: abort-safe named-operation hook and error guard.
- `components.tsx`, `knowledge-components.tsx`: server-safe display UI.
- `client-components.tsx`, `knowledge-client-components.tsx`: interactive named-operation UI.
- `plugin-*`: static validated display extensions.
- `site-components.tsx`: route-free screen composition.
- `test/fixtures/fake-workshop-client.ts`: test-only client.

The candidate binds `@gnolith/workshop@0.5.0`, protected-main commit `10ce0e1ae441094b28e61ad2772e10e1b391a464`, tree `9e4cd3270b38c89acdebac6b592862692e3c75d2`, 273978-byte archive SHA-256 `6479db87d6c2529b4a5c9e5063cc705f8f2aa3057ae4c7d5a0668e36e48163e4`, schema 11, operation schema 2, the 52-operation catalog digest `af455b4d6ab3560bca9c0ab48e9db7bd3cbcfa166ace875578d88d182069071f`, and the canonical verified asset prefix `/app`.

Candidate artifacts contain the packed tarball, CycloneDX SBOM, immutable CSS asset/manifest, checksums, commit identity, and the unresolved binding field.
