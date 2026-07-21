import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  WaystoneExtensionPoint,
  WaystonePluginProvider,
} from '../../src/plugin-components.js';
import { createWaystoneRegistry } from '../../src/plugin-registry.js';
import { fixtureFailingPlugin, fixturePlugin } from '../../src/fixture-data.js';

describe('plugin contract', () => {
  it('sorts contributions deterministically and exposes static routes', () => {
    const registry = createWaystoneRegistry([
      {
        id: 'z-plugin',
        navigation: [{ id: 'z-nav', label: 'Z', href: '/z', order: 2 }],
      },
      {
        id: 'a-plugin',
        navigation: [{ id: 'a-nav', label: 'A', href: '/a', order: 1 }],
      },
    ]);
    expect(
      registry.navigation.map(({ contribution }) => contribution.id),
    ).toEqual(['a-nav', 'z-nav']);
  });
  it('rejects invalid and duplicate identifiers clearly', () => {
    expect(() => createWaystoneRegistry([{ id: 'Bad ID' }])).toThrow(
      /Plugin ID/,
    );
    expect(() =>
      createWaystoneRegistry([
        {
          id: 'one',
          navigation: [{ id: 'shared', label: 'One', href: '/one' }],
        },
        {
          id: 'two',
          dashboardPanels: [
            { id: 'shared', label: 'Two', component: () => null },
          ],
        },
      ]),
    ).toThrow(/Duplicate contribution/);
  });
  it('renders contributions and isolates plugin failures', () => {
    const onPluginError = vi.fn();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    render(
      <WaystonePluginProvider
        registry={createWaystoneRegistry([fixturePlugin, fixtureFailingPlugin])}
        observability={{ onPluginError }}
      >
        <WaystoneExtensionPoint name="dashboardPanels" />
      </WaystonePluginProvider>,
    );
    expect(
      screen.getByText('Workshop-shaped research planning panel.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Module panel unavailable')).toBeInTheDocument();
    expect(onPluginError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
