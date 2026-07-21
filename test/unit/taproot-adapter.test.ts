import { describe, expect, it } from 'vitest';
import {
  fromTaprootEntity,
  fromTaprootRevision,
  fromTaprootRevisionMetadata,
  fromTaprootSearchPage,
  type TaprootPage as Page,
  type TaprootResolvedEntity,
  type TaprootRevisionEntry,
  type TaprootSearchResult as SearchResult,
  type TaprootStatement,
} from '../../src/taproot-adapter.js';

const statement: TaprootStatement = {
  id: 'Q7$statement',
  type: 'statement',
  text: 'Record seven is related to record eight.',
  rank: 'preferred',
  mainsnak: {
    snaktype: 'value',
    property: 'P1',
    datatype: 'wikibase-item',
    datavalue: {
      type: 'wikibase-entityid',
      value: { 'entity-type': 'item', id: 'Q8', 'numeric-id': 8 },
    },
  },
  qualifiers: {},
  'qualifiers-order': [],
  references: [],
};

const canonical = {
  id: 'Q7',
  type: 'item',
  labels: { en: { language: 'en', value: 'Canonical record' } },
  descriptions: { en: { language: 'en', value: 'Taproot JSON' } },
  aliases: { en: [{ language: 'en', value: 'Record seven' }] },
  claims: {
    P1: [statement],
  },
  sitelinks: {
    research: {
      site: 'research',
      title: 'Canonical record',
      badges: [],
      url: 'https://example.test/record',
    },
  },
  lastrevid: 4,
  modified: '2026-07-20T12:00:00.000Z',
} satisfies import('../../src/taproot-contracts.js').TaprootWikibaseEntity;

describe('Taproot protocol adapter', () => {
  it('derives the display entity from canonical Taproot JSON and lifecycle state', () => {
    const resolved: TaprootResolvedEntity = {
      entity: canonical,
      requestedId: 'Q6',
      resolvedId: 'Q7',
      redirects: ['Q6'],
      deletedAt: null,
      redirectTo: 'Q7',
    };
    const entity = fromTaprootEntity(resolved);
    expect(entity).toMatchObject({
      id: 'Q7',
      labels: { en: 'Canonical record' },
      aliases: { en: ['Record seven'] },
      revision: 4,
      redirect: 'Q7',
    });
    expect(entity.statements.P1?.[0]?.mainsnak.datavalue).toBe('Q8');
    expect(entity.statements.P1?.[0]?.text).toBe(
      'Record seven is related to record eight.',
    );
    expect(entity.sitelinks?.research?.url).toBe('https://example.test/record');
  });

  it('maps revisions and attribution without losing lifecycle metadata', () => {
    const revision: TaprootRevisionEntry = {
      entityId: 'Q7',
      revision: 4,
      entity: canonical,
      actor: null,
      attribution: { id: 'researcher:1', kind: 'human', name: 'Researcher' },
      editSummary: 'Added source',
      tags: [],
      eventId: 'event-4',
      contentHash: 'hash-4',
      parentHash: 'hash-3',
      deletedAt: '2026-07-20T13:00:00.000Z',
      redirectTo: null,
      createdAt: '2026-07-20T13:00:00.000Z',
    };
    expect(fromTaprootRevision(revision).deleted).toBe(true);
    expect(fromTaprootRevisionMetadata(revision)).toEqual({
      revision: 4,
      timestamp: revision.createdAt,
      author: 'Researcher',
      summary: 'Added source',
    });
  });

  it('converts Taproot cursor pages and deduplicates term matches', () => {
    const page: Page<SearchResult> = {
      cursor: 'next-page',
      items: [
        {
          entityId: 'Q7',
          entityType: 'item',
          language: 'en',
          termType: 'label',
          value: 'Canonical record',
        },
        {
          entityId: 'Q7',
          entityType: 'item',
          language: 'en',
          termType: 'alias',
          value: 'Record seven',
        },
      ],
    };
    expect(fromTaprootSearchPage(page)).toEqual({
      results: [
        {
          id: 'Q7',
          type: 'item',
          label: 'Canonical record',
          match: 'Canonical record',
        },
      ],
      nextCursor: 'next-page',
    });
  });
});
