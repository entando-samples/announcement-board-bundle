import { describe, expect, it } from 'vitest';
import { readContext } from './context';

describe('readContext', () => {
  it('reads page code and language from contextParams', () => {
    const context = readContext({ contextParams: { page_code: ' homepage ', info_currentLang: 'it' } }, 'en-US');
    expect(context).toEqual({ pageCode: 'homepage', locale: 'it' });
  });

  it('falls back to the browser locale when the language is missing or invalid', () => {
    expect(readContext({}, 'fr-FR')).toEqual({ pageCode: undefined, locale: 'fr-FR' });
    expect(readContext({ contextParams: { info_currentLang: 'not a locale!' } }, 'de').locale).toBe('de');
  });

  it('falls back to English when nothing usable is available', () => {
    expect(readContext({}, '').locale).toBe('en');
    expect(readContext({ contextParams: { page_code: '  ' } }, '').pageCode).toBeUndefined();
  });
});
