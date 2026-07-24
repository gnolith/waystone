import type { ComponentType, ReactNode } from 'react';
import type {
  PluginErrorEvent,
  WaystoneObservability,
  WikibaseEntity,
} from './model.js';

export type WaystonePluginCapability =
  'dashboard:view' | 'entity:view' | 'result:view' | 'settings:view';

export interface WaystonePluginContext {
  locale?: string;
  theme?: 'light' | 'dark' | 'system';
}

interface StaticContribution<Props> {
  id: string;
  label: string;
  order?: number;
  component: ComponentType<Props>;
}

export type WaystoneDashboardContribution =
  StaticContribution<WaystonePluginContext>;

export interface WaystoneEntityPanelContribution extends StaticContribution<
  WaystonePluginContext & { entity: WikibaseEntity }
> {
  supports?: (entity: WikibaseEntity) => boolean;
}

export type WaystoneResultContribution = StaticContribution<
  WaystonePluginContext & { result: unknown }
>;

export type WaystoneSettingsContribution =
  StaticContribution<WaystonePluginContext>;

export interface WaystonePlugin {
  id: string;
  label: string;
  version: string;
  capabilities: readonly WaystonePluginCapability[];
  dashboardPanels?: readonly WaystoneDashboardContribution[];
  entityPanels?: readonly WaystoneEntityPanelContribution[];
  resultPanels?: readonly WaystoneResultContribution[];
  settingsPanels?: readonly WaystoneSettingsContribution[];
}

/** @deprecated Rename the type to WaystonePlugin. No runtime adapter is retained. */
export type WorkshopCompatibleWaystonePlugin = WaystonePlugin;
/** @deprecated Rename the type to WaystonePlugin. */
export type WaystonePluginInput = WaystonePlugin;

export type WaystoneExtensionName =
  'dashboardPanels' | 'entityPanels' | 'resultPanels' | 'settingsPanels';

export interface RegisteredContribution<T> {
  pluginId: string;
  contribution: T;
}

export interface WaystoneRegistry {
  readonly plugins: readonly WaystonePlugin[];
  readonly dashboardPanels: readonly RegisteredContribution<WaystoneDashboardContribution>[];
  readonly entityPanels: readonly RegisteredContribution<WaystoneEntityPanelContribution>[];
  readonly resultPanels: readonly RegisteredContribution<WaystoneResultContribution>[];
  readonly settingsPanels: readonly RegisteredContribution<WaystoneSettingsContribution>[];
}

export interface WaystonePluginProviderProps {
  registry: WaystoneRegistry;
  context?: WaystonePluginContext;
  observability?: Pick<WaystoneObservability, 'onPluginError'>;
  children: ReactNode;
}

export type PluginErrorObserver = (event: PluginErrorEvent) => void;
