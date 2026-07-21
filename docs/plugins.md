# Plugin authoring

Plugins are statically imported by generated Site integration files. Waystone never scans the filesystem and route descriptors never create routes at runtime; they tell the installer which public component export to place in an App Router file.

```tsx
import type { WaystonePlugin } from '@gnolith/waystone/plugin';

function ResearchPanel() {
  return <p>Module-owned research workflow.</p>;
}

export const plugin: WaystonePlugin = {
  id: 'example-research',
  label: 'Research tools',
  version: '1.0.0',
  navigation: [
    { id: 'example-research-nav', label: 'Research work', href: '/work' },
  ],
  dashboardPanels: [
    {
      id: 'example-research-dashboard',
      label: 'Research plan',
      component: ResearchPanel,
    },
  ],
  routeDescriptors: [
    {
      id: 'example-research-route',
      label: 'Research work',
      path: '/work',
      exportName: 'ResearchWorkPage',
      requiresClient: true,
    },
  ],
};
```

Register in declared order with `createWaystoneRegistry([plugin])`, wrap generated layout content in `WaystonePluginProvider`, and render named `WaystoneExtensionPoint` slots. Plugin and contribution IDs are lowercase stable identifiers and contribution IDs are globally unique. Order is numeric first, then plugin and contribution ID. Invalid IDs, duplicate IDs, and non-absolute descriptor paths throw immediately. Rendering failures are isolated and reported through `WaystoneObservability.onPluginError`.

Plugins receive only the documented client and capability context plus an entity for entity panels. They do not receive host secrets, database bindings, authorization internals, or filesystem access. `fixturePlugin` under `@gnolith/waystone/fixtures` is deliberately Workshop-shaped without creating a Workshop dependency.
