'use client';

import { ResourcePage } from '@gnolith/waystone/site';
import { CanaryShell, client } from '../../waystone';

export default function Page() {
  return (
    <CanaryShell currentPath="/resources/R1">
      <ResourcePage
        client={client}
        resource={{
          id: 'R1',
          revision: 1,
          title: 'Canary Resource',
          linkedItemIds: ['Q1'],
          selectedExcerpt: 'Canary excerpt',
        }}
      />
    </CanaryShell>
  );
}
