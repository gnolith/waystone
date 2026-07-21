import { describe, expect, it } from 'vitest';
import {
  createMockWaystoneClient,
  fixtureItem,
  fixtureStatements,
} from '../../src/fixture-data.js';
import type {
  EntityMutationOperation,
  WaystoneStatement,
} from '../../src/model.js';

const candidate = (text: string): WaystoneStatement => ({
  ...fixtureStatements[0]!,
  id: 'Q1$new',
  text,
});

describe('authored statement revision text', () => {
  it.each([
    [
      'absent',
      {
        op: 'add-statement',
        statement: { ...candidate('valid'), text: undefined },
      },
    ],
    ['empty', { op: 'add-statement', statement: candidate('') }],
    [
      'ASCII whitespace',
      {
        op: 'replace-statement',
        statementId: 'Q1$preferred',
        statement: candidate(' \t\n'),
      },
    ],
    [
      'Unicode whitespace',
      {
        op: 'set-rank',
        statementId: 'Q1$preferred',
        rank: 'normal',
        text: '\u00a0\u2003',
      },
    ],
  ])('rejects %s text', async (_case, operation) => {
    const client = createMockWaystoneClient();
    await expect(
      client.entities.mutate(
        fixtureItem.id,
        { operations: [operation as EntityMutationOperation] },
        { expectedRevision: fixtureItem.revision },
      ),
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('preserves exact unchanged and changed text through mock adapters', async () => {
    const client = createMockWaystoneClient();
    const unchanged = fixtureStatements[0]!.text;
    const afterReplace = await client.entities.mutate(
      fixtureItem.id,
      {
        operations: [
          {
            op: 'replace-statement',
            statementId: 'Q1$preferred',
            statement: candidate(unchanged),
          },
        ],
      },
      { expectedRevision: fixtureItem.revision },
    );
    expect(afterReplace.statements.P1?.at(-1)?.text).toBe(unchanged);

    const afterRank = await client.entities.mutate(
      fixtureItem.id,
      {
        operations: [
          {
            op: 'set-rank',
            statementId: 'Q1$new',
            rank: 'deprecated',
            text: '  A newly authored rank explanation.  ',
          },
        ],
      },
      { expectedRevision: afterReplace.revision },
    );
    expect(
      afterRank.statements.P1?.find((statement) => statement.id === 'Q1$new')
        ?.text,
    ).toBe('  A newly authored rank explanation.  ');
  });

  it('keeps removal exempt from authored text', async () => {
    const client = createMockWaystoneClient();
    await expect(
      client.entities.mutate(
        fixtureItem.id,
        {
          operations: [{ op: 'remove-statement', statementId: 'Q1$preferred' }],
        },
        { expectedRevision: fixtureItem.revision },
      ),
    ).resolves.toMatchObject({ revision: fixtureItem.revision + 1 });
  });
});
