// Shape of the JSON that Entando passes in the widget's `config` attribute.
// Every leaf value is a string.
export interface MfeConfig {
  systemParams?: {
    api?: Record<string, { url: string }>;
  };
  params?: Record<string, string>;
  contextParams?: Record<string, string>;
}

export function parseConfig(raw: string | null): MfeConfig {
  if (!raw) {
    return {};
  }
  try {
    const value: unknown = JSON.parse(raw);
    return value !== null && typeof value === 'object' ? (value as MfeConfig) : {};
  } catch {
    console.warn('[announcement-board] ignoring malformed config attribute');
    return {};
  }
}
