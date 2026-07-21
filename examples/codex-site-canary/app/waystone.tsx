'use client';

import type { ReactNode } from 'react';
import {
  createMockWaystoneClient,
  fixturePlugin,
} from '@gnolith/waystone/fixtures';
import {
  createWaystoneRegistry,
  type WaystonePlugin,
} from '@gnolith/waystone/plugin';
import { GnolithShell } from '@gnolith/waystone/site';

function CanaryPanel() {
  return <p>This dummy module proves the public extension contract.</p>;
}

const canaryPlugin: WaystonePlugin = {
  id: 'canary-module',
  label: 'Canary module',
  version: '0.1.0',
  navigation: [
    { id: 'canary-module-nav', label: 'Canary module', href: '/module' },
  ],
  dashboardPanels: [
    {
      id: 'canary-module-dashboard',
      label: 'Canary extension',
      component: CanaryPanel,
    },
  ],
  routeDescriptors: [
    {
      id: 'canary-module-route',
      label: 'Canary module',
      path: '/module',
      exportName: 'CanaryPanel',
      requiresClient: true,
    },
  ],
};

export const client = createMockWaystoneClient();
export const registry = createWaystoneRegistry([fixturePlugin, canaryPlugin]);

export function CanaryShell({
  currentPath,
  children,
}: {
  currentPath: string;
  children: ReactNode;
}) {
  return (
    <GnolithShell
      registry={registry}
      client={client}
      title="Waystone Canary"
      subtitle="A bounded research knowledge interface"
      currentPath={currentPath}
      session={{
        displayName: 'Canary researcher',
        capabilities: {
          createEntity: true,
          editEntity: true,
          deleteEntity: true,
          revertRevision: true,
          querySparql: true,
        },
      }}
    >
      {children}
    </GnolithShell>
  );
}
