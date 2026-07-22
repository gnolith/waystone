'use client';

import { ResourcePage } from '@gnolith/waystone/site';
import { CanaryShell, client } from '../../waystone';

export default function Page() {
  return (
    <CanaryShell currentPath="/resources/R1">
      <ResourcePage
        client={client}
        resource={{
          version: 1,
          id: 'R1',
          itemId: 'Q1',
          revision: 1,
          title: 'Canary Resource',
          payload: { kind: 'inline-text', text: 'Canary excerpt' },
          mediaType: 'text/plain',
          integrity: { algorithm: 'sha256', digest: 'canary', byteLength: 14 },
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
