import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SparqlEditor, UnifiedSearchScreen } from '../../src/client.js';
import { fixtureSearchPage } from '../../src/fixtures.js';
import { callWorkshop } from '../../src/workshop-client.js';
import { createFakeWorkshopClient } from '../fixtures/fake-workshop-client.js';

describe('Workshop named-operation boundary', () => {
  it('routes search and hydration only through operation names', async () => {
    const { client, calls } = createFakeWorkshopClient({
      'search.query': fixtureSearchPage,
      'search.hydrate': { id: 'Q1' },
    });
    render(<UnifiedSearchScreen client={client} initialQuery="research" />);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Research object')).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Open authorized result' })[0]!,
    );
    await screen.findByText(/hydrated by Workshop/i);
    expect(calls.map((call) => call.name)).toEqual([
      'search.query',
      'search.hydrate',
    ]);
    expect(calls[0]?.input).toMatchObject({
      text: 'research',
      kinds: [
        'item',
        'statement',
        'task',
        'memory',
        'prompt',
        'resource',
        'annotation',
      ],
    });
  });

  it('forwards abort signals without creating transport state', async () => {
    const controller = new AbortController();
    const { client, calls } = createFakeWorkshopClient({
      'memory.get': { slug: 'one' },
    });
    await callWorkshop(
      client,
      'memory.get',
      { slug: 'one' },
      {
        signal: controller.signal,
      },
    );
    expect(calls[0]?.options?.signal).toBe(controller.signal);
  });

  it('validates then queries SPARQL through named operations', async () => {
    const { client, calls } = createFakeWorkshopClient({
      'sparql.validate': { valid: true, issues: [] },
      'sparql.query': {
        kind: 'boolean',
        value: true,
      },
    });
    render(<SparqlEditor client={client} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run query' }));
    expect(await screen.findByText(/ASK result/i)).toBeInTheDocument();
    expect(calls.map((call) => call.name)).toEqual([
      'sparql.validate',
      'sparql.query',
    ]);
  });

  it('contains no route, fetch, bearer, storage, host-operation, or Taproot implementation', () => {
    const sourceRoot = path.resolve('src');
    const files = readdirSync(sourceRoot)
      .filter((file) => /\.(?:ts|tsx)$/.test(file))
      .map((file) => readFileSync(path.join(sourceRoot, file), 'utf8'))
      .join('\n');
    expect(files).not.toMatch(/\/api\//);
    expect(files).not.toMatch(/\bfetch\s*\(/);
    expect(files).not.toMatch(/headers?\.set\(\s*['"]authorization/i);
    expect(files).not.toMatch(/authorization\s*:/i);
    expect(files).not.toMatch(/`Bearer \$\{/);
    expect(files).not.toMatch(/localStorage|sessionStorage/);
    expect(files).not.toMatch(/HostOperation|snapshot|restore/);
    expect(files).not.toMatch(/Taproot/);
  });
});
