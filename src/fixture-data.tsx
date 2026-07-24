import type {
  AnnotationViewModel,
  MemoryViewModel,
  PromptViewModel,
  ReadinessView,
  ResourcePreviewView,
  SearchAdministrationView,
  SearchPageView,
  SparqlQueryResult,
  TaskPacketView,
  TaskViewModel,
  WikibaseEntity,
} from './model.js';
import type { WaystonePlugin } from './plugin-contracts.js';

export const fixtureItem: WikibaseEntity = {
  id: 'Q1',
  type: 'item',
  labels: { en: 'Research object' },
  descriptions: { en: 'A browser-safe Waystone fixture.' },
  aliases: { en: ['Fixture item'] },
  statements: {
    P1: [
      {
        id: 'Q1$statement',
        text: 'The fixture links to a related object.',
        rank: 'normal',
        mainsnak: {
          snaktype: 'value',
          property: 'P1',
          datatype: 'wikibase-item',
          datavalue: 'Q2',
        },
      },
    ],
  },
  sitelinks: {},
  revision: 3,
  modified: '2026-07-23T00:00:00Z',
};

export const fixtureProperty: WikibaseEntity = {
  id: 'P1',
  type: 'property',
  labels: { en: 'related object' },
  descriptions: { en: 'Links one object to another.' },
  aliases: {},
  statements: {},
  datatype: 'wikibase-item',
  revision: 2,
  modified: '2026-07-23T00:00:00Z',
};

export const fixtureSearchPage: SearchPageView = {
  results: [
    {
      kind: 'item',
      sourceId: 'Q1',
      sourceRevision: '3',
      entityType: 'item',
      score: 0.82,
      title: 'Research object',
      snippet: 'A browser-safe fixture.',
    },
    {
      kind: 'item',
      sourceId: 'P1',
      sourceRevision: '2',
      entityType: 'property',
      score: 0.79,
      title: 'related object',
      snippet: 'A canonical Property represented within the item kind.',
    },
    {
      kind: 'task',
      sourceId: 'task-1',
      sourceRevision: '4',
      score: 0.71,
      title: 'Review sources',
      snippet: 'Review the available research sources.',
    },
    {
      kind: 'resource',
      sourceId: 'resource-1#derived-1',
      sourceRevision: '1',
      score: 0.68,
      snippet: 'Derived chunk that is not a canonical object.',
      hiddenDerivedChunk: true,
    },
  ],
};

export const fixtureResource: ResourcePreviewView = {
  id: 'resource-1',
  itemId: 'Q1',
  revision: 1,
  title: 'Fixture source',
  mediaType: 'text/plain',
  byteLength: 23,
  sha256: '0'.repeat(64),
  payloadKind: 'inline-text',
  text: 'Fixture resource body.',
};

export const fixtureAnnotation: AnnotationViewModel = {
  id: 'annotation-1',
  revision: 1,
  bodyText: 'Important supporting passage.',
  targetKind: 'resource',
  targetId: 'resource-1',
  selector: { type: 'text-position', start: 0, end: 9 },
};

export const fixturePrompt: PromptViewModel = {
  id: 'prompt-1',
  name: 'summarize',
  title: 'Summarize sources',
  promptText: 'Summarize {{source}}.',
  variables: { source: { type: 'string' } },
  active: true,
  priority: 0,
  order: 0,
  language: 'en',
  revision: 1,
};

export const fixtureMemory: MemoryViewModel = {
  slug: 'fixture-memory',
  title: 'Fixture memory',
  description: 'Reusable context.',
  content: 'Prefer primary sources.',
  language: 'en',
  revision: 1,
  updatedAt: '2026-07-23T00:00:00Z',
};

export const fixtureTask: TaskViewModel = {
  id: 'task-1',
  title: 'Review sources',
  description: 'Review the available research sources.',
  objective: 'Create an evidence-backed summary.',
  state: 'claimed',
  constraints: ['Use primary sources'],
  acceptanceCriteria: ['Citations are traceable'],
  prompt: 'Review all sources.',
  revision: 4,
  updatedAt: '2026-07-23T00:00:00Z',
  lease: {
    ownerPrincipalId: 'researcher-1',
    leaseToken: 'fixture-lease-token',
    claimedAt: '2026-07-23T00:00:00Z',
    expiresAt: '2026-07-23T01:00:00Z',
  },
};

export const fixtureTaskPacket: TaskPacketView = {
  task: fixtureTask,
  context: [{ label: 'Related objects', query: 'SELECT * WHERE { ?s ?p ?o }' }],
  memories: [fixtureMemory],
  resolvedAt: '2026-07-23T00:00:00Z',
};

export const fixtureReadiness: ReadinessView = {
  authenticated: true,
  authorized: true,
  lexicalReady: true,
  semanticConfigured: true,
  semanticReady: false,
  semanticReason: 'Provider temporarily unavailable',
  partial: true,
};

export const fixtureSearchAdministration: SearchAdministrationView = {
  authorized: true,
  state: 'degraded',
  selectedConfiguration: 'default',
  pendingJobs: 2,
};

export const fixtureSparqlBindings: SparqlQueryResult = {
  kind: 'bindings',
  variables: ['item'],
  bindings: [{ item: { type: 'uri', value: 'https://example.test/Q1' } }],
  elapsedMs: 12,
};

function FixturePanel() {
  return <p>Static fixture extension.</p>;
}

export const fixturePlugin: WaystonePlugin = {
  id: 'fixture',
  label: 'Fixture',
  version: '1.0.0',
  capabilities: ['dashboard:view'],
  dashboardPanels: [
    {
      id: 'fixture-panel',
      label: 'Fixture panel',
      component: FixturePanel,
    },
  ],
};
