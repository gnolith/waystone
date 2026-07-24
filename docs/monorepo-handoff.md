# Monorepo handoff

Source ownership:

- `model.ts`: UI projections and the structural Workshop client.
- `workshop-client.ts`: abort-safe named-operation hook and error guard.
- `components.tsx`, `knowledge-components.tsx`: server-safe display UI.
- `client-components.tsx`, `knowledge-client-components.tsx`: interactive named-operation UI.
- `plugin-*`: static validated display extensions.
- `site-components.tsx`: route-free screen composition.
- `test/fixtures/fake-workshop-client.ts`: test-only client.

The candidate binds `@gnolith/workshop@0.5.0`, commit `abbdb1c3f07d8466883c9f00ad3927c81ca78769`, archive SHA-256 `6d466fa1f91ba93efe070dada9ad8b1e14bde6b4d9cc7e94bdefcb3f25fe95d4`, schema 11, the 52-operation catalog digest `a57799a792a075a5e359567240a7241a48df4155fae3a9e73b092ccf9035955b`, and the canonical verified asset prefix `/app`.

Candidate artifacts contain the packed tarball, CycloneDX SBOM, immutable CSS asset/manifest, checksums, commit identity, and the unresolved binding field.
