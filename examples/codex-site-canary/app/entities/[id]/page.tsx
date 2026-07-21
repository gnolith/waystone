'use client';

import {
  EntityEditor,
  EntityLifecycleControls,
  SitelinkEditor,
  StatementEditor,
} from '@gnolith/waystone/client';
import {
  fixtureDeleted,
  fixtureItem,
  fixtureMissingLabel,
  fixtureRedirect,
} from '@gnolith/waystone/fixtures';
import { GnolithEntityPage } from '@gnolith/waystone/site';
import { CanaryShell, client } from '../../waystone';

export default function EntityRoute({ params }: { params: { id: string } }) {
  const entity =
    params.id === 'Q2'
      ? fixtureMissingLabel
      : params.id === 'Q3'
        ? fixtureDeleted
        : params.id === 'Q4'
          ? fixtureRedirect
          : fixtureItem;
  return (
    <CanaryShell currentPath="/entities">
      <GnolithEntityPage entity={entity} />
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
