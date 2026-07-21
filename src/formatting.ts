import type {
  CoordinateValue,
  QuantityValue,
  SnakDataValue,
  TimeValue,
  WikibaseEntity,
  WaystoneSnak,
} from './model.js';

export function entityLabel(
  entity: Pick<WikibaseEntity, 'id' | 'labels'>,
  language = 'en',
): string {
  return (
    entity.labels[language] ??
    Object.values(entity.labels).find(Boolean) ??
    entity.id
  );
}

export function formatTime(value: TimeValue, locale?: string): string {
  const iso = value.time.replace(/^\+/, '');
  const date = new Date(iso);
  return Number.isNaN(date.valueOf())
    ? value.time
    : new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(date);
}

export function formatTimestamp(value: string, locale = 'en'): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function formatQuantity(value: QuantityValue, locale?: string): string {
  const amount = Number(value.amount);
  const displayed = Number.isFinite(amount)
    ? new Intl.NumberFormat(locale).format(amount)
    : value.amount;
  const result =
    value.unit && value.unit !== '1' ? `${displayed} ${value.unit}` : displayed;
  if (value.lowerBound || value.upperBound) {
    const lower = value.lowerBound ?? '-infinity';
    const upper = value.upperBound ?? '+infinity';
    return `${result} (range ${lower} to ${upper})`;
  }
  return result;
}

export function formatCoordinate(value: CoordinateValue): string {
  const lat = `${Math.abs(value.latitude).toFixed(5)}° ${value.latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(value.longitude).toFixed(5)}° ${value.longitude >= 0 ? 'E' : 'W'}`;
  const details = [
    value.precision !== undefined
      ? `precision ${value.precision} degrees`
      : undefined,
    value.globe ? `globe ${value.globe}` : undefined,
  ].filter(Boolean);
  return `${lat}, ${lon}${details.length ? ` (${details.join(', ')})` : ''}`;
}

const supportedDatatypes = new Set([
  'wikibase-item',
  'wikibase-property',
  'string',
  'external-id',
  'url',
  'commonsMedia',
  'monolingualtext',
  'time',
  'quantity',
  'globe-coordinate',
]);

export function formatSnakValue(snak: WaystoneSnak, locale?: string): string {
  if (snak.snaktype === 'somevalue') return 'Unknown value';
  if (snak.snaktype === 'novalue') return 'No value';
  if (!supportedDatatypes.has(snak.datatype))
    return `Unsupported datatype: ${snak.datatype}`;
  const value: SnakDataValue | undefined = snak.datavalue;
  if (value === undefined || value === null) return 'Malformed value';
  if (typeof value === 'string') return value;
  if ('text' in value) return `${value.text} (${value.language})`;
  if ('time' in value) return formatTime(value, locale);
  if ('amount' in value) return formatQuantity(value, locale);
  if ('latitude' in value) return formatCoordinate(value);
  return 'Unsupported value';
}

export function externalIdHref(
  template: string,
  id: string,
): string | undefined {
  return safeExternalUrl(template.replace('$1', encodeURIComponent(id)));
}

export function safeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
