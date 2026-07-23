import type {
  RegisteredContribution,
  WaystoneDashboardContribution,
  WaystoneEntityPanelContribution,
  WaystonePlugin,
  WaystonePluginCapability,
  WaystoneRegistry,
  WaystoneResultContribution,
  WaystoneSettingsContribution,
} from './plugin-contracts.js';

const PLUGIN_KEYS = new Set([
  'id',
  'label',
  'version',
  'capabilities',
  'dashboardPanels',
  'entityPanels',
  'resultPanels',
  'settingsPanels',
]);
const CONTRIBUTION_KEYS = new Set([
  'id',
  'label',
  'order',
  'component',
  'supports',
]);
const CAPABILITIES = new Set<WaystonePluginCapability>([
  'dashboard:view',
  'entity:view',
  'result:view',
  'settings:view',
]);

function assertId(value: string, kind: string): void {
  if (!/^[a-z][a-z0-9]*(?:[-.][a-z0-9]+)*$/.test(value))
    throw new TypeError(`${kind} ID "${value}" is invalid.`);
}

function assertExactKeys(
  value: Readonly<Record<string, unknown>>,
  allowed: ReadonlySet<string>,
  kind: string,
) {
  for (const key of Object.keys(value))
    if (!allowed.has(key))
      throw new TypeError(
        `${kind} key "${key}" is not allowed. Plugins cannot register routes, tools, auth, fetch interception, or server operations.`,
      );
}

function collect<T extends { id: string; order?: number }>(
  plugins: readonly WaystonePlugin[],
  key: 'dashboardPanels' | 'entityPanels' | 'resultPanels' | 'settingsPanels',
): readonly RegisteredContribution<T>[] {
  const entries: RegisteredContribution<T>[] = [];
  for (const plugin of plugins)
    for (const contribution of plugin[key] ?? []) {
      assertExactKeys(
        contribution as unknown as Readonly<Record<string, unknown>>,
        CONTRIBUTION_KEYS,
        'Contribution',
      );
      assertId(contribution.id, 'Contribution');
      entries.push({
        pluginId: plugin.id,
        contribution: Object.freeze({ ...contribution }) as unknown as T,
      });
    }
  return Object.freeze(
    entries.sort(
      (left, right) =>
        (left.contribution.order ?? 0) - (right.contribution.order ?? 0) ||
        left.pluginId.localeCompare(right.pluginId) ||
        left.contribution.id.localeCompare(right.contribution.id),
    ),
  );
}

export function createWaystoneRegistry(
  definitions: readonly WaystonePlugin[] = [],
): WaystoneRegistry {
  const seenPlugins = new Set<string>();
  const seenContributions = new Set<string>();
  const plugins = definitions.map((definition) => {
    assertExactKeys(
      definition as unknown as Readonly<Record<string, unknown>>,
      PLUGIN_KEYS,
      'Plugin',
    );
    assertId(definition.id, 'Plugin');
    if (seenPlugins.has(definition.id))
      throw new TypeError(`Duplicate plugin ID "${definition.id}".`);
    seenPlugins.add(definition.id);
    for (const capability of definition.capabilities)
      if (!CAPABILITIES.has(capability))
        throw new TypeError(`Unsupported plugin capability "${capability}".`);
    for (const key of [
      'dashboardPanels',
      'entityPanels',
      'resultPanels',
      'settingsPanels',
    ] as const)
      for (const contribution of definition[key] ?? []) {
        assertId(contribution.id, 'Contribution');
        if (seenContributions.has(contribution.id))
          throw new TypeError(
            `Duplicate contribution ID "${contribution.id}".`,
          );
        seenContributions.add(contribution.id);
      }
    return Object.freeze({ ...definition });
  });
  return Object.freeze({
    plugins: Object.freeze(plugins),
    dashboardPanels: collect<WaystoneDashboardContribution>(
      plugins,
      'dashboardPanels',
    ),
    entityPanels: collect<WaystoneEntityPanelContribution>(
      plugins,
      'entityPanels',
    ),
    resultPanels: collect<WaystoneResultContribution>(plugins, 'resultPanels'),
    settingsPanels: collect<WaystoneSettingsContribution>(
      plugins,
      'settingsPanels',
    ),
  });
}

export const registerWaystonePlugins = createWaystoneRegistry;
