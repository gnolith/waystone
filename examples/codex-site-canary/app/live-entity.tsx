'use client';

import { useEffect, useState } from 'react';
import {
  EntityEditor,
  EntityLifecycleControls,
  SitelinkEditor,
  StatementEditor,
} from '@gnolith/waystone/client';
import type { WikibaseEntity } from '@gnolith/waystone';
import { GnolithEntityPage, GnolithPropertyPage } from '@gnolith/waystone/site';
import { CanaryShell, client } from './waystone';

export function LiveEntity({
  id,
  fallback,
  property = false,
}: {
  id: string;
  fallback: WikibaseEntity;
  property?: boolean;
}) {
  const [entity, setEntity] = useState(fallback);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    void client.entities
      .get(id as WikibaseEntity['id'], { signal: controller.signal })
      .then((value) => {
        setEntity(value);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError')
          return;
        setError(
          cause instanceof Error ? cause.message : 'Entity loading failed.',
        );
      });
    return () => controller.abort();
  }, [id]);

  const Page = property ? GnolithPropertyPage : GnolithEntityPage;
  return (
    <CanaryShell currentPath="/entities">
      {error && (
        <div className="ws-alert ws-alert--warning" role="alert">
          {error}
        </div>
      )}
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
