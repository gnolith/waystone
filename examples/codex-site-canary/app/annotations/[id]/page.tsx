'use client';

import { AnnotationPage } from '@gnolith/waystone/site';
import { CanaryShell, client } from '../../waystone';

export default function Page() {
  return (
    <CanaryShell currentPath="/annotations/A1">
      <AnnotationPage
        client={client}
        annotation={{
          id: 'A1',
          revision: 1,
          targetId: 'R1',
          body: 'Canary annotation',
        }}
      />
    </CanaryShell>
  );
}
