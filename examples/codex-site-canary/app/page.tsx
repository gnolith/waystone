'use client';

import { fixtureRevisions } from '@gnolith/waystone/fixtures';
import { GnolithHome } from '@gnolith/waystone/site';
import { CanaryShell, client } from './waystone';

export default function Home() {
  return (
    <CanaryShell currentPath="/">
      <GnolithHome
        client={client}
        summary={{ items: 3, properties: 1, statements: 9 }}
        revisions={fixtureRevisions}
        modules={[
          { id: 'canary-module', label: 'Canary module', version: '0.1.0' },
        ]}
      />
    </CanaryShell>
  );
}
