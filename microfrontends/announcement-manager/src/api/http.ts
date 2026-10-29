import type { MfeConfig } from '../config';

/** Name of the API claim declared for this widget in entando.json. */
export const API_CLAIM = 'announcement-api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Server-side validation errors by field name (400 responses). */
    readonly fieldErrors: Record<string, string> = {},
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
  token?: TokenProvider;
  fetchImpl?: typeof fetch;
}

export async function requestJson<T>(
  url: string,
  init: RequestInit = {},
  { token, fetchImpl }: RequestOptions = {},
): Promise<T> {
  const send = async (forceRefresh: boolean) => {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }
    const accessToken = token && (await token(forceRefresh));
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    try {
      // Resolve fetch per call so test doubles installed later are honoured.
      return await (fetchImpl ?? fetch)(url, { ...init, headers });
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
    throw await toApiError(response);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as {
      detail?: string;
      errors?: { field: string; message: string }[];
    };
    const fieldErrors = Object.fromEntries((problem.errors ?? []).map((e) => [e.field, e.message]));
    return new ApiError(response.status, problem.detail ?? `HTTP ${response.status}`, fieldErrors);
  } catch {
    return new ApiError(response.status, `HTTP ${response.status}`);
  }
}
