'use client';

import {
  Component,
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from 'react';
import { WaystoneErrorDisplay } from './components.js';
import type { PluginErrorEvent, WikibaseEntity } from './model.js';
import type {
  RegisteredContribution,
  WaystoneDashboardContribution,
  WaystoneEntityPanelContribution,
  WaystoneExtensionName,
  WaystoneOnboardingContribution,
  WaystonePluginContext,
  WaystonePluginProviderProps,
  WaystoneRegistry,
  WaystoneSettingsContribution,
} from './plugin-contracts.js';

interface ContextValue {
  registry: WaystoneRegistry;
  context: WaystonePluginContext;
  onPluginError?: (event: PluginErrorEvent) => void;
}
const PluginContext = createContext<ContextValue | undefined>(undefined);
export function WaystonePluginProvider({
  registry,
  context = {},
  observability,
  children,
}: WaystonePluginProviderProps) {
  return (
    <PluginContext.Provider
      value={{
        registry,
        context,
        ...(observability?.onPluginError
          ? {
              onPluginError: (event: PluginErrorEvent) =>
                observability.onPluginError?.(event),
            }
          : {}),
      }}
    >
      {children}
    </PluginContext.Provider>
  );
}
function usePlugins() {
  const value = useContext(PluginContext);
  if (!value)
    throw new Error(
      'WaystoneExtensionPoint must be rendered inside WaystonePluginProvider.',
    );
  return value;
}
class PluginBoundary extends Component<
  {
    pluginId: string;
    contributionId: string;
    onError?: ((event: PluginErrorEvent) => void) | undefined;
    children: ReactNode;
  },
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    this.props.onError?.({
      pluginId: this.props.pluginId,
      contributionId: this.props.contributionId,
      error,
    });
  }
  render() {
    return this.state.error ? (
      <WaystoneErrorDisplay
        title="Module panel unavailable"
        error={this.state.error}
      />
    ) : (
      this.props.children
    );
  }
}
type RenderableContribution =
  | WaystoneDashboardContribution
  | WaystoneEntityPanelContribution
  | WaystoneOnboardingContribution
  | WaystoneSettingsContribution;
export function WaystoneExtensionPoint({
  name,
  entity,
  onComplete,
  empty = null,
}: {
  name: WaystoneExtensionName;
  entity?: WikibaseEntity;
  onComplete?: () => void;
  empty?: ReactNode;
}) {
  const { registry, context, onPluginError } = usePlugins();
  const entries = registry[
    name
  ] as readonly RegisteredContribution<RenderableContribution>[];
  const visible = entries.filter(
    ({ contribution }) =>
      name !== 'entityPanels' ||
      !entity ||
      !(contribution as WaystoneEntityPanelContribution).supports ||
      (contribution as WaystoneEntityPanelContribution).supports?.(entity),
  );
  if (!visible.length) return <>{empty}</>;
  return (
    <div className={`ws-extensions ws-extensions--${name}`}>
      {visible.map(({ pluginId, contribution }) => {
        const props = {
          ...context,
          ...(entity ? { entity } : {}),
          ...(onComplete ? { onComplete } : {}),
        };
        const Panel = contribution.component as ComponentType<typeof props>;
        return (
          <section
            className="ws-extension"
            key={`${pluginId}:${contribution.id}`}
            aria-labelledby={`extension-${pluginId}-${contribution.id}`}
          >
            <h2 id={`extension-${pluginId}-${contribution.id}`}>
              {contribution.label}
            </h2>
            <PluginBoundary
              pluginId={pluginId}
              contributionId={contribution.id}
              {...(onPluginError ? { onError: onPluginError } : {})}
            >
              <Panel {...props} />
            </PluginBoundary>
          </section>
        );
      })}
    </div>
  );
}
