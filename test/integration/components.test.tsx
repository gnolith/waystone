import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import {
  EntityPage,
  RevisionDiff,
  RevisionList,
  SparqlResults,
  WaystoneShell,
} from '../../src/components.js';
import {
  CreateEntityEditor,
  EntityEditor,
  EntitySearch,
  SparqlEditor,
  StatementEditor,
} from '../../src/client-components.js';
import {
  WaystoneExtensionPoint,
  WaystonePluginProvider,
} from '../../src/plugin-components.js';
import { createWaystoneRegistry } from '../../src/plugin-registry.js';
import {
  createMockWaystoneClient,
  fixtureItem,
  fixtureRevisions,
  fixtureSparqlAsk,
  fixtureSparqlBindings,
  fixturePlugin,
} from '../../src/fixture-data.js';

describe('knowledge UI', () => {
  it('renders complete statements, ranks, qualifiers, references, and missing-value states', () => {
    render(<EntityPage entity={fixtureItem} />);
    expect(
      screen.getByRole('heading', { name: 'Field specimen' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred rank')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Deprecated rank').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('Qualifiers').length).toBeGreaterThan(0);
    expect(screen.getAllByText('References').length).toBeGreaterThan(0);
    expect(
      screen.getByText('The specimen is related to the comparison object.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Unknown value')).toBeInTheDocument();
    expect(screen.getByText('No value')).toBeInTheDocument();
  });
  it('supports search, creation, edits, and structured statement maintenance', async () => {
    const client = createMockWaystoneClient();
    const created = vi.fn();
    const view = render(
      <>
        <EntitySearch client={client} />
        <CreateEntityEditor client={client} onCreated={created} />
      </>,
    );
    fireEvent.change(screen.getByLabelText(/Search by label/), {
      target: { value: 'Field' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Field specimen')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'New record' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create item' }));
    await waitFor(() => expect(created).toHaveBeenCalled());
    view.unmount();
    const saved = vi.fn();
    render(
      <>
        <EntityEditor client={client} entity={fixtureItem} onSaved={saved} />
        <StatementEditor client={client} entity={fixtureItem} />
      </>,
    );
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Revised' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(
      screen.getByRole('button', { name: 'Replace statement' }),
    ).toBeDisabled();
  });

  it('requires and preserves newly authored text for statement revisions', async () => {
    const mutate = vi.fn().mockResolvedValue(fixtureItem);
    const client = {
      ...createMockWaystoneClient(),
      entities: { ...createMockWaystoneClient().entities, mutate },
    };
    render(<StatementEditor client={client} entity={fixtureItem} />);
    const text = screen.getByLabelText(
      'Authored text for this statement revision',
    );
    const replace = screen.getByRole('button', { name: 'Replace statement' });
    const rank = screen.getByRole('button', { name: 'Change rank' });

    expect(text).toHaveValue('');
    expect(replace).toBeDisabled();
    expect(rank).toBeDisabled();
    fireEvent.change(text, { target: { value: '\u00a0\u2003' } });
    expect(replace).toBeDisabled();
    expect(rank).toBeDisabled();

    fireEvent.change(text, {
      target: { value: '  Confirmed unchanged text  ' },
    });
    fireEvent.click(replace);
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0]?.[1]).toMatchObject({
      operations: [
        {
          op: 'replace-statement',
          statement: { text: '  Confirmed unchanged text  ' },
        },
      ],
    });
    await waitFor(() => expect(text).toHaveValue(''));

    fireEvent.change(text, { target: { value: 'Changed rank explanation' } });
    fireEvent.click(rank);
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(2));
    expect(mutate.mock.calls[1]?.[1]).toEqual({
      operations: [
        {
          op: 'set-rank',
          statementId: fixtureItem.statements.P1?.[0]?.id,
          rank: 'preferred',
          text: 'Changed rank explanation',
        },
      ],
    });
  });
  it('renders revision and all SPARQL result kinds', () => {
    const { rerender } = render(<RevisionList revisions={fixtureRevisions} />);
    expect(screen.getByText('Revision 7')).toBeInTheDocument();
    rerender(
      <RevisionDiff
        before={{ ...fixtureItem, revision: 6 }}
        after={fixtureItem}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /Compare revisions/ }),
    ).toBeInTheDocument();
    rerender(<SparqlResults result={fixtureSparqlBindings} />);
    expect(
      screen.getByRole('table', { name: /SPARQL query bindings/ }),
    ).toBeInTheDocument();
    rerender(<SparqlResults result={fixtureSparqlAsk} />);
    expect(screen.getByText('true')).toBeInTheDocument();
  });
  it('validates and executes SPARQL while preserving the query', async () => {
    render(<SparqlEditor client={createMockWaystoneClient()} />);
    const editor = screen.getByLabelText('SPARQL query');
    fireEvent.change(editor, { target: { value: 'ASK { ?s ?p ?o }' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    await screen.findByText('Complete');
    fireEvent.click(screen.getByRole('button', { name: 'Run query' }));
    expect(await screen.findByText('true')).toBeInTheDocument();
    expect(editor).toHaveValue('ASK { ?s ?p ?o }');
  });
  it('has no automated accessibility violations in the shell and entity surface', async () => {
    const { container } = render(
      <WaystoneShell
        title="Research Site"
        subtitle="Material culture"
        navigation={[{ id: 'home', label: 'Home', href: '/' }]}
        currentPath="/"
      >
        <EntityPage entity={fixtureItem} />
      </WaystoneShell>,
    );
    const result = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
  it('has no automated accessibility violations across search, forms, editors, tables, and plugins', async () => {
    const client = createMockWaystoneClient();
    const registry = createWaystoneRegistry([fixturePlugin]);
    const { container } = render(
      <WaystonePluginProvider registry={registry}>
        <WaystoneShell title="Research Site">
          <EntitySearch client={client} />
          <CreateEntityEditor client={client} />
          <StatementEditor client={client} entity={fixtureItem} />
          <SparqlEditor client={client} />
          <WaystoneExtensionPoint name="dashboardPanels" />
        </WaystoneShell>
      </WaystonePluginProvider>,
    );
    const result = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
