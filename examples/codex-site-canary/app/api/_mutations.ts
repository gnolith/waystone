import type {
  EntityMutationInput,
  WaystoneSnak,
  WaystoneStatement,
} from '@gnolith/waystone';
import type {
  DataValue,
  EntityDatatype,
  EntityId,
  PropertyId,
  Snak,
  Statement,
  TaprootRepository,
} from '@gnolith/taproot';
import { edit } from './_taproot';

function dataValue(snak: WaystoneSnak): DataValue | undefined {
  if (snak.snaktype !== 'value' || snak.datavalue === undefined) return;
  const value = snak.datavalue;
  if (
    (snak.datatype === 'wikibase-item' ||
      snak.datatype === 'wikibase-property') &&
    typeof value === 'string'
  ) {
    return {
      type: 'wikibase-entityid',
      value: {
        'entity-type': snak.datatype === 'wikibase-item' ? 'item' : 'property',
        id: value as EntityId,
      },
    };
  }
  if (
    snak.datatype === 'monolingualtext' &&
    typeof value === 'object' &&
    value !== null &&
    'text' in value
  )
    return { type: 'monolingualtext', value };
  if (
    snak.datatype === 'time' &&
    typeof value === 'object' &&
    value !== null &&
    'time' in value
  )
    return {
      type: 'time',
      value: {
        time: value.time,
        timezone: 0,
        before: 0,
        after: 0,
        precision: value.precision ?? 11,
        calendarmodel:
          value.calendarModel ?? 'http://www.wikidata.org/entity/Q1985727',
      },
    };
  if (
    snak.datatype === 'quantity' &&
    typeof value === 'object' &&
    value !== null &&
    'amount' in value
  )
    return {
      type: 'quantity',
      value: {
        amount: value.amount,
        unit: value.unit ?? '1',
        ...(value.lowerBound ? { lowerBound: value.lowerBound } : {}),
        ...(value.upperBound ? { upperBound: value.upperBound } : {}),
      },
    };
  if (
    snak.datatype === 'globe-coordinate' &&
    typeof value === 'object' &&
    value !== null &&
    'latitude' in value
  )
    return {
      type: 'globecoordinate',
      value: {
        latitude: value.latitude,
        longitude: value.longitude,
        altitude: null,
        precision: value.precision ?? null,
        globe: value.globe ?? 'http://www.wikidata.org/entity/Q2',
      },
    };
  return { type: 'string', value: String(value) };
}

function canonicalSnak(snak: WaystoneSnak): Snak {
  return {
    snaktype: snak.snaktype,
    property: snak.property as PropertyId,
    datatype: snak.datatype as EntityDatatype,
    ...(dataValue(snak) ? { datavalue: dataValue(snak) } : {}),
  };
}

function canonicalStatement(statement: WaystoneStatement): Statement {
  const qualifiers = Object.fromEntries(
    Object.entries(statement.qualifiers ?? {}).map(([property, snaks]) => [
      property,
      snaks.map(canonicalSnak),
    ]),
  ) as Record<PropertyId, Snak[]>;
  return {
    id: statement.id,
    type: 'statement',
    rank: statement.rank,
    mainsnak: canonicalSnak(statement.mainsnak),
    qualifiers,
    'qualifiers-order': Object.keys(qualifiers) as PropertyId[],
    references: (statement.references ?? []).map((reference) => {
      const snaks = Object.fromEntries(
        Object.entries(reference.snaks).map(([property, values]) => [
          property,
          values.map(canonicalSnak),
        ]),
      ) as Record<PropertyId, Snak[]>;
      return {
        hash: reference.hash ?? crypto.randomUUID().replaceAll('-', ''),
        snaks,
        'snaks-order': Object.keys(snaks) as PropertyId[],
      };
    }),
  };
}

export async function applyWaystoneMutations(
  repository: TaprootRepository,
  request: Request,
  id: EntityId,
  input: EntityMutationInput,
  initialRevision: number,
) {
  let revision = initialRevision;
  let result;
  for (const operation of input.operations) {
    const metadata = edit(request, revision);
    switch (operation.op) {
      case 'set-label':
        result = await repository.setLabel(
          id,
          operation.language,
          operation.value,
          metadata,
        );
        break;
      case 'set-description':
        result = await repository.setDescription(
          id,
          operation.language,
          operation.value,
          metadata,
        );
        break;
      case 'add-alias':
        result = await repository.addAlias(
          id,
          operation.language,
          operation.value,
          metadata,
        );
        break;
      case 'remove-alias': {
        const current = await repository.getEntity(id);
        const ordinal =
          current.entity.aliases[operation.language]?.findIndex(
            (alias) => alias.value === operation.value,
          ) ?? -1;
        if (ordinal < 0) throw new Error('Alias no longer exists.');
        result = await repository.removeAlias(
          id,
          operation.language,
          ordinal,
          metadata,
        );
        break;
      }
      case 'set-sitelink':
        result = await repository.setSitelink(
          id as `Q${number}`,
          operation.site,
          { site: operation.site, title: operation.title, badges: [] },
          metadata,
        );
        break;
      case 'remove-sitelink':
        result = await repository.removeSitelink(
          id as `Q${number}`,
          operation.site,
          metadata,
        );
        break;
      case 'add-statement':
        result = await repository.addStatement(
          id,
          canonicalStatement(operation.statement),
          metadata,
        );
        break;
      case 'replace-statement':
        result = await repository.replaceStatement(
          id,
          operation.statementId,
          canonicalStatement(operation.statement),
          metadata,
        );
        break;
      case 'remove-statement':
        result = await repository.removeStatement(
          id,
          operation.statementId,
          metadata,
        );
        break;
      case 'set-rank':
        result = await repository.setStatementRank(
          id,
          operation.statementId,
          operation.rank,
          metadata,
        );
        break;
      case 'redirect':
        result = await repository.redirectEntity(
          id,
          operation.target,
          metadata,
        );
        break;
      case 'soft-delete':
        result = await repository.softDeleteEntity(id, metadata);
        break;
      case 'revert':
        result = await repository.revertEntity(
          id,
          operation.revision,
          metadata,
        );
        break;
    }
    revision = result.newRevision;
  }
  return result ?? repository.getEntity(id);
}
