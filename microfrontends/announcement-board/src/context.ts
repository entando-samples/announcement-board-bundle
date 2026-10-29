import type { MfeConfig } from './config';

/** Read-only page context supplied by Entando through `contextParams`. */
export interface BoardContext {
  pageCode?: string;
  locale: string;
}

export function readContext(config: MfeConfig, fallbackLocale = navigator.language): BoardContext {
  const params = config.contextParams ?? {};
  const pageCode = params.page_code?.trim() || undefined;
  return { pageCode, locale: canonicalLocale(params.info_currentLang) ?? canonicalLocale(fallbackLocale) ?? 'en' };
}

function canonicalLocale(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  try {
    return Intl.getCanonicalLocales(value.trim())[0];
  } catch {
    return undefined;
  }
}
