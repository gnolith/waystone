'use client';

import { SparqlPage } from '@gnolith/waystone/site';
import { CanaryShell, client } from '../waystone';

export default function QueryPage() {
  return (
    <CanaryShell currentPath="/sparql">
      <SparqlPage client={client} />
    </CanaryShell>
  );
}
