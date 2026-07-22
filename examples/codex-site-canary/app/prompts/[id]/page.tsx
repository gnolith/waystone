'use client';

import { PromptPage } from '@gnolith/waystone/site';
import { CanaryShell, client } from '../../waystone';

export default function Page() {
  return (
    <CanaryShell currentPath="/prompts/PROMPT1">
      <PromptPage
        client={client}
        prompt={{
          id: 'PROMPT1',
          name: 'canary',
          revision: 1,
          title: 'Canary Prompt',
          promptText: 'Summarize {{resource}}',
          variables: { resource: { type: 'string' } },
          active: true,
          priority: 0,
          order: 0,
          language: 'en',
          attribution: {},
          policyRevision: 1,
          installationId: 'canary',
          ownerPrincipalId: 'canary',
          workspaceId: 'canary',
          visibility: { version: 1, clauses: [] },
          authorizationRevision: 1,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }}
      />
    </CanaryShell>
  );
}
