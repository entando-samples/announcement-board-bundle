import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PARAMS, parseBoardParams } from './boardParams';

describe('parseBoardParams', () => {
  it('uses defaults when nothing is configured', () => {
    expect(parseBoardParams()).toEqual(DEFAULT_PARAMS);
    expect(parseBoardParams({})).toEqual(DEFAULT_PARAMS);
  });

  it('parses valid string values', () => {
    expect(
      parseBoardParams({ boardTitle: ' Course notices ', pageSize: '5', defaultCategory: 'TRAINING', showSearchBox: 'false' }),
    ).toEqual({ boardTitle: 'Course notices', pageSize: 5, defaultCategory: 'TRAINING', showSearchBox: false });
  });

  it('treats ALL as no default category', () => {
    expect(parseBoardParams({ defaultCategory: 'ALL' }).defaultCategory).toBeUndefined();
  });

  it.each([
    ['boardTitle', ''],
    ['boardTitle', 'x'.repeat(81)],
    ['pageSize', '0'],
    ['pageSize', '51'],
    ['pageSize', '2.5'],
    ['pageSize', 'ten'],
    ['defaultCategory', 'PARTY'],
    ['showSearchBox', 'yes'],
  ])('falls back to the default for an invalid %s (%j) and warns', (key, value) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseBoardParams({ [key]: value })).toEqual(DEFAULT_PARAMS);
    expect(warn).toHaveBeenCalledWith(`[announcement-board] invalid param "${key}", using default`);
  });

  it('keeps valid values when others are invalid', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseBoardParams({ boardTitle: 'Notices', pageSize: '500' })).toEqual({
      ...DEFAULT_PARAMS,
      boardTitle: 'Notices',
    });
  });
});
