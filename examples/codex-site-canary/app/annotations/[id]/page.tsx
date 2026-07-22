'use client';

import { AnnotationPage } from '@gnolith/waystone/site';
import { CanaryShell, client } from '../../waystone';

export default function Page() {
  return (
    <CanaryShell currentPath="/annotations/A1">
      <AnnotationPage
        client={client}
        annotation={{
          version: 1,
          id: 'A1',
          revision: 1,
          target: { kind: 'resource', sourceId: 'R1' },
          body: { kind: 'text', text: 'Canary annotation' },
          attribution: { id: 'canary', kind: 'system' },
          authorization: {
            installationId: 'canary',
            workspaceId: null,
            ownerPrincipalId: 'canary',
            policyRevision: 1,
            visibility: { version: 1, clauses: [] },
          },
          createdAt: '2026-01-01T00:00:00Z',
          modifiedAt: '2026-01-01T00:00:00Z',
          deletedAt: null,
        }}
      />
    </CanaryShell>
  );
}
