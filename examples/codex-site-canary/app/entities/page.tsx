'use client';

import { CreateEntityEditor, EntitySearch } from '@gnolith/waystone/client';
import { CanaryShell, client } from '../waystone';

export default function EntitiesPage() {
  return (
    <CanaryShell currentPath="/entities">
      <header>
        <p className="ws-eyebrow">Knowledge discovery</p>
        <h1>Entities</h1>
      </header>
      <EntitySearch client={client} />
      <CreateEntityEditor client={client} />
    </CanaryShell>
  );
}
