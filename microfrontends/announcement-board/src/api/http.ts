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

/** Supplies an access token; `forceRefresh` asks for a new one after a 401. */
export type TokenProvider = (forceRefresh?: boolean) => Promise<string | undefined>;

export interface RequestOptions {
  /** Only protected operations pass a token provider; the public search never does. */
  token?: TokenProvider;
  fetchImpl?: typeof fetch;
}

export async function getJson<T>(url: string, { token, fetchImpl }: RequestOptions = {}): Promise<T> {
  const send = async (forceRefresh: boolean) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const accessToken = token && (await token(forceRefresh));
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    try {
      // Resolve fetch per call so test doubles installed later are honoured.
      return await (fetchImpl ?? fetch)(url, { headers });
    } catch {
      throw new ApiError(0, 'The announcement service is unreachable.');
    }
  };

  let response = await send(false);
  if (response.status === 401 && token) {
    // The token may have expired in flight: refresh once and retry.
    response = await send(true);
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
