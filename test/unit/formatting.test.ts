import { describe, expect, it } from 'vitest';
import {
  entityLabel,
  externalIdHref,
  formatCoordinate,
  formatQuantity,
  formatSnakValue,
  formatTime,
} from '../../src/formatting.js';
import { publicErrorMessage, WaystoneRequestError } from '../../src/errors.js';

describe('display formatting', () => {
  it('falls back from language to another label and then ID', () => {
    expect(entityLabel({ id: 'Q1', labels: { fr: 'Objet' } })).toBe('Objet');
    expect(entityLabel({ id: 'Q2', labels: {} })).toBe('Q2');
  });
  it('formats required structured datatypes without discarding source values', () => {
    expect(formatTime({ time: '+2026-07-20T00:00:00Z' }, 'en-US')).toContain(
      '2026',
    );
    expect(formatQuantity({ amount: '+12.5', unit: 'cm' }, 'en-US')).toContain(
      '12.5 cm',
    );
    expect(formatCoordinate({ latitude: 41.8, longitude: -87.6 })).toContain(
      'N',
    );
    expect(
      formatSnakValue({
        snaktype: 'somevalue',
        property: 'P1',
        datatype: 'string',
      }),
    ).toBe('Unknown value');
    expect(
      formatSnakValue({
        snaktype: 'novalue',
        property: 'P1',
        datatype: 'string',
      }),
    ).toBe('No value');
    expect(
      formatSnakValue({
        snaktype: 'value',
        property: 'P1',
        datatype: 'new-datatype',
        datavalue: 'opaque',
      }),
    ).toBe('Unsupported datatype: new-datatype');
  });
  it('only creates safe external identifier links', () => {
    expect(externalIdHref('https://example.test/id/$1', 'A/B')).toContain(
      'A%2FB',
    );
    expect(externalIdHref('javascript:$1', 'alert(1)')).toBeUndefined();
  });
  it('keeps diagnostics private in generic public errors', () => {
    const error = new WaystoneRequestError('database stack trace', {
      kind: 'server',
    });
    expect(publicErrorMessage(error)).not.toContain('database');
    expect(
      publicErrorMessage(
        new WaystoneRequestError('bad field', { kind: 'validation' }),
      ),
    ).toBe('bad field');
  });
});
