import type {
  RegisteredContribution,
  WaystoneDashboardContribution,
  WaystoneEntityPanelContribution,
  WaystoneNavigationContribution,
  WaystoneOnboardingContribution,
  WaystonePlugin,
  WaystonePluginInput,
  WaystoneRegistry,
  WaystoneRouteDescriptor,
  WaystoneSettingsContribution,
} from './plugin-contracts.js';
import type { ComponentType } from 'react';

function contextualComponent<T>(
  component: ComponentType<Record<string, never>>,
): ComponentType<T> {
  return component as unknown as ComponentType<T>;
}

function isWorkshopShape(
  plugin: WaystonePluginInput,
): plugin is import('./plugin-contracts.js').WorkshopCompatibleWaystonePlugin {
  return 'name' in plugin;
}

function normalizePlugin(plugin: WaystonePluginInput): WaystonePlugin {
  if (!isWorkshopShape(plugin)) return plugin;
  return {
    id: plugin.id,
    label: plugin.name,
    ...(plugin.version ? { version: plugin.version } : {}),
    ...(plugin.navigation ? { navigation: plugin.navigation } : {}),
    ...(plugin.dashboardPanels
      ? {
          dashboardPanels: plugin.dashboardPanels.map((item) => ({
            id: item.id,
            label: item.title,
            component: contextualComponent<
              import('./plugin-contracts.js').WaystonePluginContext
            >(item.component),
          })),
        }
      : {}),
    ...(plugin.entityPanels
      ? {
          entityPanels: plugin.entityPanels.map((item) => ({
            id: item.id,
            label: item.title,
            component: contextualComponent<
              import('./plugin-contracts.js').WaystonePluginContext & {
                entity: import('./model.js').WikibaseEntity;
              }
            >(item.component),
          })),
        }
      : {}),
    ...(plugin.onboarding
      ? {
          onboardingSteps: plugin.onboarding.map((item) => ({
            id: item.id,
            label: item.title,
            component: contextualComponent<
              import('./plugin-contracts.js').WaystonePluginContext & {
                onComplete?: () => void;
              }
            >(item.component),
          })),
        }
      : {}),
    ...(plugin.settingsPanels
      ? {
          settingsPanels: plugin.settingsPanels.map((item) => ({
            id: item.id,
            label: item.title,
            component: contextualComponent<
              import('./plugin-contracts.js').WaystonePluginContext
            >(item.component),
          })),
        }
      : {}),
    ...(plugin.routes
      ? {
          routeDescriptors: plugin.routes.map((item) => ({
            id: `${item.id}-route`,
            label: item.id,
            path: item.path,
            exportName: item.component.name || item.id,
            requiresClient: true,
          })),
        }
      : {}),
  };
}

function assertId(value: string, kind: string): void {
  if (!/^[a-z][a-z0-9]*(?:[-.][a-z0-9]+)*$/.test(value))
    throw new TypeError(
      `${kind} ID "${value}" must be lowercase and may contain digits, dots, and hyphens.`,
    );
}
function collect<T extends { id: string; order?: number }>(
  plugins: readonly WaystonePlugin[],
  key: keyof WaystonePlugin,
): readonly RegisteredContribution<T>[] {
  const entries: RegisteredContribution<T>[] = [];
  for (const plugin of plugins) {
    const contributions = (plugin[key] ?? []) as unknown as readonly T[];
    for (const contribution of contributions) {
      assertId(contribution.id, 'Contribution');
      entries.push({ pluginId: plugin.id, contribution });
    }
  }
  return Object.freeze(
    entries.sort(
      (a, b) =>
        (a.contribution.order ?? 0) - (b.contribution.order ?? 0) ||
        a.pluginId.localeCompare(b.pluginId) ||
        a.contribution.id.localeCompare(b.contribution.id),
    ),
  );
}
export function createWaystoneRegistry(
  definitions: readonly WaystonePluginInput[] = [],
): WaystoneRegistry {
  const plugins = definitions.map(normalizePlugin);
  const seen = new Set<string>();
  const contributionIds = new Set<string>();
  const contributionKeys = [
    'navigation',
    'dashboardPanels',
    'entityPanels',
    'onboardingSteps',
    'settingsPanels',
    'routeDescriptors',
  ] as const;
  for (const plugin of plugins) {
    assertId(plugin.id, 'Plugin');
    if (seen.has(plugin.id))
      throw new TypeError(`Duplicate plugin ID "${plugin.id}".`);
    seen.add(plugin.id);
    for (const key of contributionKeys) {
      for (const contribution of plugin[key] ?? []) {
        assertId(contribution.id, 'Contribution');
        if (contributionIds.has(contribution.id))
          throw new TypeError(
            `Duplicate contribution ID "${contribution.id}".`,
          );
        contributionIds.add(contribution.id);
      }
    }
    for (const descriptor of plugin.routeDescriptors ?? []) {
      if (!descriptor.path.startsWith('/'))
        throw new TypeError(
          `Route descriptor "${plugin.id}:${descriptor.id}" must use an absolute Site path.`,
        );
    }
  }
  return Object.freeze({
    plugins: Object.freeze([...plugins]),
    navigation: collect<WaystoneNavigationContribution>(plugins, 'navigation'),
    dashboardPanels: collect<WaystoneDashboardContribution>(
      plugins,
      'dashboardPanels',
    ),
    entityPanels: collect<WaystoneEntityPanelContribution>(
      plugins,
      'entityPanels',
    ),
    onboardingSteps: collect<WaystoneOnboardingContribution>(
      plugins,
      'onboardingSteps',
    ),
    settingsPanels: collect<WaystoneSettingsContribution>(
      plugins,
      'settingsPanels',
    ),
    routeDescriptors: collect<WaystoneRouteDescriptor>(
      plugins,
      'routeDescriptors',
    ),
  });
}
export const registerWaystonePlugins = createWaystoneRegistry;
