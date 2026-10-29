import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, normalizeParams, validateParam, validateParams } from './params';

describe('board config params', () => {
  it('accepts the defaults', () => {
    expect(validateParams(DEFAULT_PARAMS)).toEqual({});
  });

  it.each([
    ['boardTitle', '   '],
    ['boardTitle', 'x'.repeat(81)],
    ['pageSize', ''],
    ['pageSize', '0'],
    ['pageSize', '51'],
    ['pageSize', '1.5'],
    ['defaultCategory', 'PARTY'],
    ['showSearchBox', 'maybe'],
  ] as const)('rejects %s = %j', (name, value) => {
    expect(validateParam(name, value)).toBeDefined();
  });

  it('normalises partial, typed or missing input to strings with defaults', () => {
    expect(normalizeParams(undefined)).toEqual(DEFAULT_PARAMS);
    expect(normalizeParams({ pageSize: 5, showSearchBox: false, unknown: 'x' })).toEqual({
      ...DEFAULT_PARAMS,
      pageSize: '5',
      showSearchBox: 'false',
    });
  });
});
