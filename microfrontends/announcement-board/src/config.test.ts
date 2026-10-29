import { describe, expect, it, vi } from 'vitest';
import { parseConfig } from './config';

describe('parseConfig', () => {
  it('returns an empty config when the attribute is missing', () => {
    expect(parseConfig(null)).toEqual({});
    expect(parseConfig('')).toEqual({});
  });

  it('parses the Entando config object', () => {
    const raw = JSON.stringify({ systemParams: { api: { 'announcement-api': { url: 'http://ms' } } } });
    expect(parseConfig(raw).systemParams?.api?.['announcement-api'].url).toBe('http://ms');
  });

  it('ignores malformed JSON and non-object values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseConfig('{not json')).toEqual({});
    expect(parseConfig('42')).toEqual({});
    expect(parseConfig('null')).toEqual({});
    expect(warn).toHaveBeenCalledOnce();
  });
});
