import type {
  AliasMap as TaprootAliasMap,
  DataValueValue as TaprootDataValueValue,
  EntityIdValue as TaprootEntityIdValue,
  GlobeCoordinateValue as TaprootCoordinateValue,
  LanguageMap as TaprootLanguageMap,
  Page as TaprootPage,
  Reference as TaprootReference,
  ResolvedEntity as TaprootResolvedEntity,
  RevisionEntry as TaprootRevisionEntry,
  SearchResult as TaprootSearchResult,
  Snak as TaprootSnak,
  Statement as TaprootStatement,
  StoredEntity as TaprootStoredEntity,
  WikibaseEntity as TaprootWikibaseEntity,
} from '@gnolith/taproot';
import type {
  CoordinateValue,
  EntityRevisionMetadata,
  EntitySearchResult,
  MonolingualTextValue,
  QuantityValue,
  SnakDataValue,
  TimeValue,
  WaystoneReference,
  WaystoneSnak,
  WaystoneStatement,
  WikibaseEntity,
} from './model.js';

export type {
  EntityCommand as TaprootEntityCommand,
  ExpectedRevision as TaprootExpectedRevision,
  Page as TaprootPage,
  ResolvedEntity as TaprootResolvedEntity,
  RevisionEntry as TaprootRevisionEntry,
  SearchResult as TaprootSearchResult,
  StoredEntity as TaprootStoredEntity,
  WikibaseEntity as TaprootWikibaseEntity,
} from '@gnolith/taproot';

type TaprootEntityEnvelope =
  TaprootWikibaseEntity | TaprootStoredEntity | TaprootResolvedEntity;

function isEntityEnvelope(
  value: TaprootEntityEnvelope,
): value is TaprootStoredEntity | TaprootResolvedEntity {
  return 'entity' in value;
}

function terms(values: TaprootLanguageMap): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).map(([language, term]) => [language, term.value]),
  );
}

function aliases(values: TaprootAliasMap): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(values).map(([language, entries]) => [
      language,
      entries.map((entry) => entry.value),
    ]),
  );
}

function isEntityIdValue(
  value: TaprootDataValueValue,
): value is TaprootEntityIdValue {
  return typeof value === 'object' && value !== null && 'id' in value;
}

function isMonolingualText(
  value: TaprootDataValueValue,
): value is MonolingualTextValue {
  return typeof value === 'object' && value !== null && 'text' in value;
}

function isTime(
  value: TaprootDataValueValue,
): value is import('@gnolith/taproot').TimeValue {
  return typeof value === 'object' && value !== null && 'time' in value;
}

function isQuantity(
  value: TaprootDataValueValue,
): value is import('@gnolith/taproot').QuantityValue {
  return typeof value === 'object' && value !== null && 'amount' in value;
}

function isCoordinate(
  value: TaprootDataValueValue,
): value is TaprootCoordinateValue {
  return typeof value === 'object' && value !== null && 'latitude' in value;
}

function dataValue(value: TaprootDataValueValue): SnakDataValue {
  if (typeof value === 'string') return value;
  if (isEntityIdValue(value)) return value.id;
  if (isMonolingualText(value)) return value;
  if (isTime(value)) {
    const result: TimeValue = {
      time: value.time,
      precision: value.precision,
      calendarModel: value.calendarmodel,
    };
    return result;
  }
  if (isQuantity(value)) {
    const result: QuantityValue = {
      amount: value.amount,
      unit: value.unit,
      ...(value.lowerBound ? { lowerBound: value.lowerBound } : {}),
      ...(value.upperBound ? { upperBound: value.upperBound } : {}),
    };
    return result;
  }
  if (isCoordinate(value)) {
    const result: CoordinateValue = {
      latitude: value.latitude,
      longitude: value.longitude,
      ...(value.precision === null ? {} : { precision: value.precision }),
      globe: value.globe,
    };
    return result;
  }
  return null;
}

export function fromTaprootSnak(snak: TaprootSnak): WaystoneSnak {
  return {
    snaktype: snak.snaktype,
    property: snak.property,
    datatype: snak.datatype,
    ...(snak.datavalue ? { datavalue: dataValue(snak.datavalue.value) } : {}),
  };
}

function snakMap(
  values: Record<string, TaprootSnak[]>,
): Record<string, WaystoneSnak[]> {
  return Object.fromEntries(
    Object.entries(values).map(([property, snaks]) => [
      property,
      snaks.map(fromTaprootSnak),
    ]),
  );
}

export function fromTaprootReference(
  reference: TaprootReference,
): WaystoneReference {
  return { hash: reference.hash, snaks: snakMap(reference.snaks) };
}

export function fromTaprootStatement(
  statement: TaprootStatement,
): WaystoneStatement {
  return {
    id: statement.id,
    rank: statement.rank,
    mainsnak: fromTaprootSnak(statement.mainsnak),
    qualifiers: snakMap(statement.qualifiers),
    references: statement.references.map(fromTaprootReference),
  };
}

/** Convert Taproot's canonical JSON plus lifecycle envelope to Waystone's display model. */
export function fromTaprootEntity(
  value: TaprootEntityEnvelope,
): WikibaseEntity {
  const entity = isEntityEnvelope(value) ? value.entity : value;
  const lifecycle = isEntityEnvelope(value) ? value : undefined;
  const sitelinks =
    entity.type === 'item'
      ? Object.fromEntries(
          Object.entries(entity.sitelinks).map(([site, link]) => [
            site,
            { title: link.title, ...(link.url ? { url: link.url } : {}) },
          ]),
        )
      : undefined;
  return {
    id: entity.id,
    type: entity.type,
    labels: terms(entity.labels),
    descriptions: terms(entity.descriptions),
    aliases: aliases(entity.aliases),
    ...(sitelinks ? { sitelinks } : {}),
    ...(entity.type === 'property' ? { datatype: entity.datatype } : {}),
    statements: Object.fromEntries(
      Object.entries(entity.claims).map(([property, statements]) => [
        property,
        statements.map(fromTaprootStatement),
      ]),
    ),
    revision: entity.lastrevid,
    modified: entity.modified,
    ...(lifecycle?.redirectTo ? { redirect: lifecycle.redirectTo } : {}),
    ...(lifecycle?.deletedAt ? { deleted: true } : {}),
  };
}

export function fromTaprootRevision(
  revision: TaprootRevisionEntry,
): WikibaseEntity {
  return fromTaprootEntity({
    entity: revision.entity,
    deletedAt: revision.deletedAt,
    redirectTo: revision.redirectTo,
  });
}

export function fromTaprootRevisionMetadata(
  revision: TaprootRevisionEntry,
): EntityRevisionMetadata {
  return {
    revision: revision.revision,
    timestamp: revision.createdAt,
    ...(revision.attribution?.name
      ? { author: revision.attribution.name }
      : revision.attribution?.id
        ? { author: revision.attribution.id }
        : revision.actor
          ? { author: revision.actor }
          : {}),
    ...(revision.editSummary ? { summary: revision.editSummary } : {}),
  };
}

export function fromTaprootSearchPage(
  page: TaprootPage<TaprootSearchResult>,
): EntitySearchResult {
  const seen = new Set<string>();
  const results = page.items.flatMap((item) => {
    if (seen.has(item.entityId)) return [];
    seen.add(item.entityId);
    return [
      {
        id: item.entityId,
        type: item.entityType,
        ...(item.termType === 'label' ? { label: item.value } : {}),
        ...(item.termType === 'description' ? { description: item.value } : {}),
        match: item.value,
      },
    ];
  });
  return { results, ...(page.cursor ? { nextCursor: page.cursor } : {}) };
}
