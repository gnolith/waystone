/* eslint-disable @typescript-eslint/require-await -- mock methods intentionally mirror the asynchronous live client */
import type {
  EntityMutationInput,
  EntityRevisionMetadata,
  SnakDataValue,
  SparqlQueryResult,
  WaystoneClient,
  WaystoneStatement,
  WikibaseEntity,
} from './model.js';
import type { WaystonePlugin as PluginContract } from './plugin-contracts.js';
import { WaystoneRequestError } from './errors.js';

const snak = (
  property: `P${number}`,
  datatype: string,
  datavalue: SnakDataValue,
): WaystoneStatement['mainsnak'] => ({
  property,
  datatype,
  snaktype: 'value',
  datavalue,
});
export const fixtureStatements: WaystoneStatement[] = [
  {
    id: 'Q1$preferred',
    rank: 'preferred',
    mainsnak: snak('P1', 'wikibase-item', 'Q2'),
    qualifiers: {
      P7: [
        snak('P7', 'time', { time: '+2026-07-20T00:00:00Z', precision: 11 }),
      ],
      P8: [snak('P8', 'string', 'field observation')],
    },
    references: [
      {
        hash: 'ref-a',
        snaks: {
          P9: [snak('P9', 'url', 'https://example.org/source')],
          P10: [snak('P10', 'external-id', 'ARCHIVE-42')],
        },
      },
      {
        hash: 'ref-b',
        snaks: { P11: [snak('P11', 'commonsMedia', 'Research_object.jpg')] },
      },
    ],
  },
  {
    id: 'Q1$normal',
    rank: 'normal',
    mainsnak: snak('P2', 'wikibase-property', 'P6'),
  },
  {
    id: 'Q1$string',
    rank: 'normal',
    mainsnak: snak('P3', 'string', 'A safely wrapped long research note'),
  },
  {
    id: 'Q1$mono',
    rank: 'normal',
    mainsnak: snak('P4', 'monolingualtext', {
      language: 'en',
      text: 'Field record',
    }),
  },
  {
    id: 'Q1$quantity',
    rank: 'normal',
    mainsnak: snak('P5', 'quantity', {
      amount: '+12.5',
      unit: 'cm',
      lowerBound: '+12.4',
      upperBound: '+12.6',
    }),
  },
  {
    id: 'Q1$coordinate',
    rank: 'normal',
    mainsnak: snak('P6', 'globe-coordinate', {
      latitude: 41.8781,
      longitude: -87.6298,
      precision: 0.0001,
    }),
  },
  {
    id: 'Q1$some',
    rank: 'normal',
    mainsnak: { property: 'P12', datatype: 'string', snaktype: 'somevalue' },
  },
  {
    id: 'Q1$none',
    rank: 'deprecated',
    mainsnak: { property: 'P13', datatype: 'time', snaktype: 'novalue' },
  },
  {
    id: 'Q1$unsupported',
    rank: 'deprecated',
    mainsnak: snak('P14', 'experimental-datatype', 'opaque'),
  },
];

export const fixtureItem: WikibaseEntity = {
  id: 'Q1',
  type: 'item',
  labels: { en: 'Field specimen' },
  descriptions: { en: 'A documented object in the research collection.' },
  aliases: { en: ['Study object', 'Specimen one'] },
  sitelinks: {
    archive: {
      title: 'Specimen record',
      url: 'https://example.org/specimen/1',
    },
  },
  statements: fixtureStatements.reduce<Record<string, WaystoneStatement[]>>(
    (groups, statement) => {
      (groups[statement.mainsnak.property] ??= []).push(statement);
      return groups;
    },
    {},
  ),
  revision: 7,
  modified: '2026-07-20T18:00:00Z',
};
export const fixtureProperty: WikibaseEntity = {
  id: 'P1',
  type: 'property',
  datatype: 'wikibase-item',
  labels: { en: 'related object' },
  descriptions: { en: 'Connects one research object to another.' },
  aliases: { en: ['related item'] },
  statements: {},
  revision: 3,
  modified: '2026-07-20T17:00:00Z',
};
export const fixtureMissingLabel: WikibaseEntity = {
  id: 'Q2',
  type: 'item',
  labels: {},
  descriptions: {},
  aliases: {},
  statements: {},
  revision: 1,
  modified: '2026-07-20T16:00:00Z',
};
export const fixtureDeleted: WikibaseEntity = {
  ...fixtureMissingLabel,
  id: 'Q3',
  deleted: true,
};
export const fixtureRedirect: WikibaseEntity = {
  ...fixtureMissingLabel,
  id: 'Q4',
  redirect: 'Q1',
};
export const fixtureRevisions: EntityRevisionMetadata[] = [
  {
    revision: 7,
    timestamp: '2026-07-20T18:00:00Z',
    author: 'Researcher A',
    summary: 'Added source details',
  },
  {
    revision: 6,
    timestamp: '2026-07-19T12:00:00Z',
    author: 'Researcher B',
    summary: 'Corrected description',
  },
  {
    revision: 5,
    timestamp: '2026-07-18T09:00:00Z',
    summary: 'Imported initial record',
  },
];
export const fixtureSearchPage = {
  results: [
    {
      id: 'Q1' as const,
      type: 'item' as const,
      label: 'Field specimen',
      description: 'A documented object',
    },
    {
      id: 'P1' as const,
      type: 'property' as const,
      label: 'related object',
      description: 'Connects research objects',
    },
    { id: 'Q2' as const, type: 'item' as const },
  ],
  nextCursor: 'page-2',
};
export const fixtureSparqlBindings: SparqlQueryResult = {
  kind: 'bindings',
  variables: ['subject', 'label'],
  bindings: [
    {
      subject: { type: 'uri', value: 'https://example.test/entity/Q1' },
      label: { type: 'literal', value: 'Field specimen', 'xml:lang': 'en' },
    },
  ],
  elapsedMs: 12,
  truncated: true,
};
export const fixtureSparqlAsk: SparqlQueryResult = {
  kind: 'boolean',
  value: true,
  elapsedMs: 4,
};
export const fixtureSparqlRdf: SparqlQueryResult = {
  kind: 'rdf',
  mediaType: 'text/turtle',
  data: '<https://example.test/entity/Q1> <https://example.test/prop/P1> <https://example.test/entity/Q2> .',
  elapsedMs: 8,
};
export const fixtureSparqlError = new WaystoneRequestError(
  'Unexpected token near WHERE.',
  { kind: 'validation', issues: [{ line: 1, column: 8 }] },
);
export const fixtureRevisionConflict = new WaystoneRequestError(
  'Expected revision 6 but found revision 7.',
  { kind: 'conflict', status: 409, requestId: 'fixture-conflict' },
);

function FixturePanel() {
  return <p>Workshop-shaped research planning panel.</p>;
}
function FailingPanel(): never {
  throw new Error('Fixture plugin failure');
}
export const fixturePlugin: PluginContract = {
  id: 'workshop-fixture',
  label: 'Workshop fixture',
  version: '0.1.0',
  navigation: [
    { id: 'work', label: 'Research work', href: '/work', order: 20 },
  ],
  dashboardPanels: [
    { id: 'research-plan', label: 'Research plan', component: FixturePanel },
  ],
  entityPanels: [
    { id: 'related-work', label: 'Related work', component: FixturePanel },
  ],
  onboardingSteps: [
    { id: 'seed-research', label: 'Seed research', component: FixturePanel },
  ],
  settingsPanels: [
    {
      id: 'research-settings',
      label: 'Research settings',
      component: FixturePanel,
    },
  ],
  routeDescriptors: [
    {
      id: 'work-route',
      label: 'Research work',
      path: '/work',
      exportName: 'WorkshopWorkPage',
      requiresClient: true,
    },
  ],
};
export const fixtureFailingPlugin: PluginContract = {
  id: 'failure-fixture',
  dashboardPanels: [
    { id: 'failure', label: 'Broken fixture panel', component: FailingPanel },
  ],
};

function applyOperations(
  entity: WikibaseEntity,
  input: EntityMutationInput,
): WikibaseEntity {
  const next = structuredClone(entity);
  for (const operation of input.operations) {
    switch (operation.op) {
      case 'set-label':
        next.labels[operation.language] = operation.value;
        break;
      case 'set-description':
        next.descriptions[operation.language] = operation.value;
        break;
      case 'add-alias':
        next.aliases[operation.language] = [
          ...(next.aliases[operation.language] ?? []),
          operation.value,
        ];
        break;
      case 'remove-alias':
        next.aliases[operation.language] = (
          next.aliases[operation.language] ?? []
        ).filter((value) => value !== operation.value);
        break;
      case 'set-sitelink':
        (next.sitelinks ??= {})[operation.site] = { title: operation.title };
        break;
      case 'remove-sitelink':
        if (next.sitelinks) delete next.sitelinks[operation.site];
        break;
      case 'add-statement':
        (next.statements[operation.statement.mainsnak.property] ??= []).push(
          operation.statement,
        );
        break;
      case 'replace-statement':
        for (const [property, statements] of Object.entries(next.statements)) {
          const index = statements.findIndex(
            (statement) => statement.id === operation.statementId,
          );
          if (index >= 0) {
            statements.splice(index, 1);
            (next.statements[operation.statement.mainsnak.property] ??=
              []).push(operation.statement);
            if (!statements.length) delete next.statements[property];
          }
        }
        break;
      case 'remove-statement':
        for (const statements of Object.values(next.statements)) {
          const index = statements.findIndex(
            (statement) => statement.id === operation.statementId,
          );
          if (index >= 0) statements.splice(index, 1);
        }
        break;
      case 'set-rank':
        for (const statements of Object.values(next.statements)) {
          const statement = statements.find(
            (value) => value.id === operation.statementId,
          );
          if (statement) statement.rank = operation.rank;
        }
        break;
      case 'redirect':
        next.redirect = operation.target;
        break;
      case 'soft-delete':
        next.deleted = true;
        break;
      case 'revert':
        next.revision = operation.revision;
        break;
    }
  }
  next.revision += 1;
  next.modified = new Date().toISOString();
  return next;
}

export function createMockWaystoneClient(
  seed: readonly WikibaseEntity[] = [
    fixtureItem,
    fixtureProperty,
    fixtureMissingLabel,
    fixtureDeleted,
    fixtureRedirect,
  ],
): WaystoneClient {
  const entities = new Map(
    seed.map((entity) => [entity.id, structuredClone(entity)]),
  );
  return {
    entities: {
      async search(input) {
        const needle = input.query.toLowerCase();
        return {
          results: [...entities.values()]
            .filter(
              (entity) =>
                entity.id.toLowerCase() === needle ||
                Object.values(entity.labels).some((value) =>
                  value?.toLowerCase().includes(needle),
                ),
            )
            .map((entity) => ({
              id: entity.id,
              type: entity.type,
              ...(entity.labels.en ? { label: entity.labels.en } : {}),
              ...(entity.descriptions.en
                ? { description: entity.descriptions.en }
                : {}),
            })),
        };
      },
      async get(id) {
        const entity = entities.get(id as WikibaseEntity['id']);
        if (!entity)
          throw new WaystoneRequestError(`Entity ${id} was not found.`, {
            kind: 'not-found',
            status: 404,
          });
        return structuredClone(entity);
      },
      async getRevision(id, revision) {
        const entity = await this.get(id);
        return { ...entity, revision };
      },
      async listRevisions() {
        return { revisions: fixtureRevisions };
      },
      async create(input, options) {
        if (options && options.expectedRevision !== 0)
          throw fixtureRevisionConflict;
        const prefix = input.type === 'property' ? 'P' : 'Q';
        const id = `${prefix}${entities.size + 10}` as WikibaseEntity['id'];
        const entity: WikibaseEntity = {
          id,
          type: input.type,
          labels: { [input.language]: input.label },
          descriptions: input.description
            ? { [input.language]: input.description }
            : {},
          aliases: {},
          statements: {},
          ...(input.datatype ? { datatype: input.datatype } : {}),
          revision: 1,
          modified: new Date().toISOString(),
        };
        entities.set(id, entity);
        return structuredClone(entity);
      },
      async mutate(id, input, options) {
        const entity = await this.get(id);
        if (!options || options.expectedRevision !== entity.revision)
          throw fixtureRevisionConflict;
        const next = applyOperations(entity, input);
        entities.set(next.id, next);
        return structuredClone(next);
      },
    },
    sparql: {
      async validate(query) {
        return query.trim()
          ? { valid: true, issues: [] }
          : { valid: false, issues: [{ message: 'Query is required.' }] };
      },
      async dryRun() {
        return fixtureSparqlBindings;
      },
      async query(query) {
        return /^\s*ASK\b/i.test(query)
          ? fixtureSparqlAsk
          : fixtureSparqlBindings;
      },
    },
  };
}
