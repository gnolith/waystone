import type { ComponentType, ReactNode } from 'react';
import type {
  WaystoneCapabilities,
  WaystoneClient,
  WaystoneObservability,
  WikibaseEntity,
} from './model.js';

export interface WaystonePluginContext {
  client?: WaystoneClient;
  capabilities?: WaystoneCapabilities;
}
export interface WaystoneNavigationContribution {
  id: string;
  label: string;
  href: string;
  order?: number;
  iconLabel?: string;
  capability?: string;
}
export interface WaystoneDashboardContribution {
  id: string;
  label: string;
  order?: number;
  component: ComponentType<WaystonePluginContext>;
}
export interface WaystoneEntityPanelContribution {
  id: string;
  label: string;
  order?: number;
  supports?: (entity: WikibaseEntity) => boolean;
  component: ComponentType<WaystonePluginContext & { entity: WikibaseEntity }>;
}
export interface WaystoneOnboardingContribution {
  id: string;
  label: string;
  order?: number;
  component: ComponentType<WaystonePluginContext & { onComplete?: () => void }>;
}
export interface WaystoneSettingsContribution {
  id: string;
  label: string;
  order?: number;
  component: ComponentType<WaystonePluginContext>;
}
export interface WaystoneRouteDescriptor {
  id: string;
  label: string;
  path: string;
  exportName: string;
  requiresClient?: boolean;
}
export interface WaystonePlugin {
  id: string;
  label?: string;
  version?: string;
  navigation?: readonly WaystoneNavigationContribution[];
  dashboardPanels?: readonly WaystoneDashboardContribution[];
  entityPanels?: readonly WaystoneEntityPanelContribution[];
  onboardingSteps?: readonly WaystoneOnboardingContribution[];
  settingsPanels?: readonly WaystoneSettingsContribution[];
  routeDescriptors?: readonly WaystoneRouteDescriptor[];
}
type EmptyPluginComponent = ComponentType<Record<string, never>>;
export interface WorkshopCompatibleWaystonePlugin {
  id: string;
  name: string;
  version?: string;
  navigation?: readonly (Omit<WaystoneNavigationContribution, 'order'> & {
    order?: number;
  })[];
  routes?: readonly {
    id: string;
    path: string;
    component: EmptyPluginComponent;
  }[];
  dashboardPanels?: readonly {
    id: string;
    title: string;
    component: EmptyPluginComponent;
  }[];
  onboarding?: readonly {
    id: string;
    title: string;
    component: EmptyPluginComponent;
  }[];
  settingsPanels?: readonly {
    id: string;
    title: string;
    capability?: string;
    component: EmptyPluginComponent;
  }[];
  entityPanels?: readonly {
    id: string;
    title: string;
    component: EmptyPluginComponent;
  }[];
}
export type WaystonePluginInput =
  WaystonePlugin | WorkshopCompatibleWaystonePlugin;
export type WaystoneExtensionName =
  'dashboardPanels' | 'entityPanels' | 'onboardingSteps' | 'settingsPanels';
export interface RegisteredContribution<T> {
  pluginId: string;
  contribution: T;
}
export interface WaystoneRegistry {
  readonly plugins: readonly WaystonePlugin[];
  readonly navigation: readonly RegisteredContribution<WaystoneNavigationContribution>[];
  readonly dashboardPanels: readonly RegisteredContribution<WaystoneDashboardContribution>[];
  readonly entityPanels: readonly RegisteredContribution<WaystoneEntityPanelContribution>[];
  readonly onboardingSteps: readonly RegisteredContribution<WaystoneOnboardingContribution>[];
  readonly settingsPanels: readonly RegisteredContribution<WaystoneSettingsContribution>[];
  readonly routeDescriptors: readonly RegisteredContribution<WaystoneRouteDescriptor>[];
}
export interface WaystonePluginProviderProps {
  registry: WaystoneRegistry;
  context?: WaystonePluginContext;
  observability?: WaystoneObservability;
  children: ReactNode;
}
