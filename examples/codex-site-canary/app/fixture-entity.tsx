'use client';

import {
  EntityEditor,
  EntityLifecycleControls,
  SitelinkEditor,
  StatementEditor,
} from '@gnolith/waystone/client';
import type { WikibaseEntity } from '@gnolith/waystone';
import { GnolithEntityPage, GnolithPropertyPage } from '@gnolith/waystone/site';
import { CanaryShell, client } from './waystone';

export function FixtureEntity({
  entity,
  property = false,
}: {
  entity: WikibaseEntity;
  property?: boolean;
}) {
  const Page = property ? GnolithPropertyPage : GnolithEntityPage;
  return (
    <CanaryShell currentPath="/entities">
      <Page entity={entity} />
      <details>
        <summary>Knowledge maintenance controls</summary>
        <EntityEditor client={client} entity={entity} />
        <SitelinkEditor client={client} entity={entity} />
        <StatementEditor client={client} entity={entity} />
        <EntityLifecycleControls client={client} entity={entity} />
      </details>
    </CanaryShell>
  );
}
