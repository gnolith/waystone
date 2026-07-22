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
          revision: 1,
          title: 'Canary Prompt',
          text: 'Summarize {{resource}}',
          variables: ['resource'],
        }}
      />
    </CanaryShell>
  );
}
