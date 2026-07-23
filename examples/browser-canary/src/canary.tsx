import { createRoot } from 'react-dom/client';
import { WaystoneShell, type WorkshopClient } from '@gnolith/waystone';
import {
  InstallationReadiness,
  TaskBrowser,
  UnifiedSearchScreen,
} from '@gnolith/waystone/client';
import { WaystoneApplicationShell } from '@gnolith/waystone/site';
import { waystoneAssetManifest } from '@gnolith/waystone/assets';

const client: WorkshopClient = {
  async call<Name extends string, Input, Output>(
    name: Name,
    _input: Input,
  ): Promise<Output> {
    let value: unknown;
    if (name === 'installation.readiness')
      value = {
        authenticated: true,
        authorized: true,
        lexicalReady: true,
        semanticConfigured: false,
        semanticReady: false,
      };
    else if (name === 'task.list') value = [];
    else if (name === 'search.query') value = { results: [] };
    else
      throw Object.assign(new Error('Unsupported canary operation.'), {
        code: 'validation_failed',
      });
    return value as Output;
  },
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <WaystoneApplicationShell>
      <WaystoneShell title="Waystone browser canary">
        <InstallationReadiness client={client} />
        <UnifiedSearchScreen client={client} />
        <TaskBrowser client={client} />
      </WaystoneShell>
    </WaystoneApplicationShell>,
  );
}
void waystoneAssetManifest;
