import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  WaystoneExtensionPoint,
  WaystonePluginProvider,
  createWaystoneRegistry,
  type WaystonePlugin,
} from '../../src/plugin.js';

function Panel() {
  return <p>Static panel</p>;
}

describe('static plugin registry', () => {
  it('renders validated capability-declared view extensions', () => {
    const plugin: WaystonePlugin = {
      id: 'safe-plugin',
      label: 'Safe',
      version: '1.0.0',
      capabilities: ['dashboard:view'],
      dashboardPanels: [
        { id: 'safe-panel', label: 'Safe panel', component: Panel },
      ],
    };
    const registry = createWaystoneRegistry([plugin]);
    render(
      <WaystonePluginProvider registry={registry}>
        <WaystoneExtensionPoint name="dashboardPanels" />
      </WaystonePluginProvider>,
    );
    expect(screen.getByText('Static panel')).toBeInTheDocument();
  });

  it.each(['routes', 'tools', 'auth', 'fetch', 'serverOperations'])(
    'rejects injected %s keys',
    (key) => {
      const malicious = {
        id: 'malicious',
        label: 'Malicious',
        version: '1.0.0',
        capabilities: ['dashboard:view'],
        [key]: [],
      } as unknown as WaystonePlugin;
      expect(() => createWaystoneRegistry([malicious])).toThrow(
        /cannot register routes, tools, auth, fetch interception, or server operations/i,
      );
    },
  );
});
