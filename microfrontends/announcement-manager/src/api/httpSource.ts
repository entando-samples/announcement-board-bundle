import { getAccessToken } from '../auth/keycloak';
import type { Announcement, AnnouncementInput, Page } from '../types';
import { requestJson, type TokenProvider } from './http';
import type { ManagerSource } from './source';

interface HttpSourceOptions {
  fetchImpl?: typeof fetch;
  token?: TokenProvider;
}

/** Every management operation is protected from step 20 and sends the access token. */
export function createHttpSource(
  baseUrl: string,
  { fetchImpl, token = getAccessToken }: HttpSourceOptions = {},
): ManagerSource {
  const collection = `${baseUrl}/api/announcements`;
  const options = { fetchImpl, token };
  return {
    list(page, size) {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      return requestJson<Page<Announcement>>(`${collection}?${params}`, {}, options);
    },
    create(input: AnnouncementInput) {
      return requestJson<Announcement>(collection, { method: 'POST', body: JSON.stringify(input) }, options);
    },
    update(id, input) {
      return requestJson<Announcement>(`${collection}/${id}`, { method: 'PUT', body: JSON.stringify(input) }, options);
    },
    remove(id) {
      return requestJson<void>(`${collection}/${id}`, { method: 'DELETE' }, options);
    },
  };
}
