# Static UI plugins

Waystone plugins are statically imported, validated display declarations. They may contribute dashboard panels, entity panels, result panels, and settings panels.

```ts
createWaystoneRegistry([
  {
    id: 'research-notes',
    label: 'Research notes',
    version: '1.0.0',
    capabilities: ['result:view'],
    resultPanels: [{ id: 'notes', label: 'Notes', component: NotesPanel }],
  },
]);
```

IDs are lowercase and unique. Unknown keys are rejected. Plugins cannot declare routes, tools, authentication, client construction, network interception, server behavior, or dynamic module discovery.
