/**
 * Structural protocol types consumed by Waystone's Taproot adapters.
 *
 * These deliberately live in Waystone rather than referring to Taproot's
 * declaration entry point. That keeps UI consumers from resolving Taproot's
 * persistence and RDF declaration graph while remaining structurally
 * compatible with the Taproot 0.3 statement-text contract pinned in
 * docs/taproot-dependencies.md.
 */
export type TaprootEntityId = `Q${number}` | `P${number}`;
export type TaprootReferencedEntityId =
  | TaprootEntityId
  | `L${number}`
  | `L${number}-F${number}`
  | `L${number}-S${number}`
  | `E${number}`;
export type TaprootPropertyId = `P${number}`;
export type TaprootEntityType = 'item' | 'property';
export type TaprootRank = 'preferred' | 'normal' | 'deprecated';
export type TaprootSnakType = 'value' | 'somevalue' | 'novalue';
export type TaprootEntityDatatype =
  | 'wikibase-item'
  | 'wikibase-property'
  | 'wikibase-lexeme'
  | 'wikibase-form'
  | 'wikibase-sense'
  | 'entity-schema'
  | 'string'
  | 'external-id'
  | 'url'
  | 'commonsMedia'
  | 'monolingualtext'
  | 'time'
  | 'quantity'
  | 'globe-coordinate'
  | 'math'
  | 'musical-notation'
  | 'geo-shape'
  | 'tabular-data';

export interface TaprootLanguageValue {
  language: string;
  value: string;
}
export type TaprootLanguageMap = Record<string, TaprootLanguageValue>;
export type TaprootAliasMap = Record<string, TaprootLanguageValue[]>;

export interface TaprootEntityIdValue {
  'entity-type':
    'item' | 'property' | 'lexeme' | 'form' | 'sense' | 'entity-schema';
  'numeric-id'?: number;
  id: TaprootReferencedEntityId;
}
export interface TaprootMonolingualTextValue {
  language: string;
  text: string;
}
export interface TaprootTimeValue {
  time: string;
  timezone: number;
  before: number;
  after: number;
  precision: number;
  calendarmodel: string;
}
export interface TaprootQuantityValue {
  amount: string;
  unit: string;
  lowerBound?: string;
  upperBound?: string;
}
export interface TaprootCoordinateValue {
  latitude: number;
  longitude: number;
  altitude: number | null;
  precision: number | null;
  globe: string;
}
export type TaprootDataValueValue =
  | string
  | TaprootEntityIdValue
  | TaprootMonolingualTextValue
  | TaprootTimeValue
  | TaprootQuantityValue
  | TaprootCoordinateValue;

export interface TaprootSnak {
  snaktype: TaprootSnakType;
  property: TaprootPropertyId;
  hash?: string;
  datatype: TaprootEntityDatatype;
  datavalue?: { value: TaprootDataValueValue; type: string };
}
export interface TaprootReference {
  hash: string;
  snaks: Record<TaprootPropertyId, TaprootSnak[]>;
  'snaks-order': TaprootPropertyId[];
}
export interface TaprootStatement {
  id: string;
  type: 'statement';
  /** Authored natural-language description of this exact statement revision. */
  text: string;
  rank: TaprootRank;
  mainsnak: TaprootSnak;
  qualifiers: Record<TaprootPropertyId, TaprootSnak[]>;
  'qualifiers-order': TaprootPropertyId[];
  references: TaprootReference[];
}
export interface TaprootSitelink {
  site: string;
  title: string;
  badges: Array<`Q${number}`>;
  url?: string;
}

interface TaprootEntityBase {
  id: TaprootEntityId;
  labels: TaprootLanguageMap;
  descriptions: TaprootLanguageMap;
  aliases: TaprootAliasMap;
  claims: Record<TaprootPropertyId, TaprootStatement[]>;
  lastrevid: number;
  modified: string;
}
export interface TaprootItem extends TaprootEntityBase {
  id: `Q${number}`;
  type: 'item';
  sitelinks: Record<string, TaprootSitelink>;
}
export interface TaprootProperty extends TaprootEntityBase {
  id: `P${number}`;
  type: 'property';
  datatype: TaprootEntityDatatype;
}
export type TaprootWikibaseEntity = TaprootItem | TaprootProperty;

export interface TaprootAttribution {
  id: string;
  kind: 'human' | 'agent' | 'import' | 'system';
  name?: string;
  organization?: string;
  tool?: string;
  url?: string;
}
export interface TaprootExpectedRevision {
  expectedRevision: number;
  actor?: string;
  attribution?: TaprootAttribution;
  editSummary?: string;
  tags?: string[];
  requestId?: string;
}
export interface TaprootStoredEntity {
  entity: TaprootWikibaseEntity;
  deletedAt: string | null;
  redirectTo: TaprootEntityId | null;
}
export interface TaprootResolvedEntity extends TaprootStoredEntity {
  requestedId: TaprootEntityId;
  resolvedId: TaprootEntityId;
  redirects: TaprootEntityId[];
}
export interface TaprootRevisionEntry {
  entityId: TaprootEntityId;
  revision: number;
  entity: TaprootWikibaseEntity;
  actor: string | null;
  attribution: TaprootAttribution | null;
  editSummary: string | null;
  tags: string[];
  eventId: string;
  contentHash: string;
  parentHash: string | null;
  deletedAt: string | null;
  redirectTo: TaprootEntityId | null;
  createdAt: string;
}
export interface TaprootPage<T> {
  items: T[];
  cursor: string | null;
}
export interface TaprootSearchResult {
  entityId: TaprootEntityId;
  entityType: TaprootEntityType;
  language: string;
  termType: 'label' | 'description' | 'alias';
  value: string;
}

export type TaprootEntityCommand =
  | { type: 'set-label'; language: string; value: string }
  | { type: 'remove-label'; language: string }
  | { type: 'set-description'; language: string; value: string }
  | { type: 'remove-description'; language: string }
  | { type: 'add-alias'; language: string; value: string }
  | { type: 'remove-alias'; language: string; ordinal: number }
  | { type: 'set-sitelink'; site: string; value: TaprootSitelink }
  | { type: 'remove-sitelink'; site: string }
  | { type: 'add-statement'; statement: TaprootStatement }
  | {
      type: 'replace-statement';
      statementId: string;
      statement: TaprootStatement;
    }
  | { type: 'remove-statement'; statementId: string }
  | {
      type: 'set-statement-rank';
      statementId: string;
      rank: TaprootRank;
      text: string;
    }
  | {
      type: 'add-qualifier';
      statementId: string;
      snak: TaprootSnak;
      text: string;
    }
  | {
      type: 'remove-qualifier';
      statementId: string;
      property: TaprootPropertyId;
      ordinal: number;
      text: string;
    }
  | {
      type: 'add-reference';
      statementId: string;
      reference: TaprootReference;
      text: string;
    }
  | {
      type: 'replace-reference';
      statementId: string;
      hash: string;
      reference: TaprootReference;
      text: string;
    }
  | {
      type: 'remove-reference';
      statementId: string;
      hash: string;
      text: string;
    };
