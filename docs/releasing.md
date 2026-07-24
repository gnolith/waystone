# Releasing

Release only from a clean candidate commit after:

1. `npm run check` passes, including audit, coverage, packed browser consumer, strict declarations, asset verification, SBOM, and bundle budgets.
2. The exact Workshop named-operation coordinate, archive SHA-256/integrity, schema, and catalog digest match `workshop-protocol-identity.json`.
3. `npm run candidate:prepare` produces an immutable tarball, CSS, asset manifest, CycloneDX SBOM, `SHA256SUMS`, and candidate metadata for that commit.
4. Protected-main review and security scanning are green.

Do not tag or publish during candidate preparation. Publication remains an independently authorized action.
