'use client';

import { SearchPage } from '@gnolith/waystone/site';
import { CanaryShell, client } from '../waystone';

export default function Page() {
  return (
    <CanaryShell currentPath="/search">
      <SearchPage client={client} />
    </CanaryShell>
  );
}
