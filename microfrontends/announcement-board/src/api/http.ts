import type { MfeConfig } from '../config';

/** Name of the API claim declared for this widget in entando.json. */
export const API_CLAIM = 'announcement-api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Base URL of announcement-ms injected by Entando (or mfe-config.json locally). */
export function apiBaseUrl(config: MfeConfig): string | undefined {
  const url = config.systemParams?.api?.[API_CLAIM]?.url?.trim();
  return url ? url.replace(/\/+$/, '') : undefined;
}

export async function getJson<T>(url: string, fetchImpl?: typeof fetch): Promise<T> {
  let response: Response;
  try {
    // Resolve fetch per call so test doubles installed later are honoured.
    response = await (fetchImpl ?? fetch)(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(0, 'The announcement service is unreachable.');
  }
  if (!response.ok) {
    throw new ApiError(response.status, await problemDetail(response));
  }
  return (await response.json()) as T;
}

async function problemDetail(response: Response): Promise<string> {
  try {
    const problem = (await response.json()) as { detail?: string };
    if (problem.detail) {
      return problem.detail;
    }
  } catch {
    // Not a Problem Details body.
  }
  return `HTTP ${response.status}`;
}
