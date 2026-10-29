import { getAccessToken } from '../auth/keycloak';
import type { AnnouncementDetail, AnnouncementSummary, Page, SearchQuery } from '../types';
import { getJson, type TokenProvider } from './http';
import type { AnnouncementSource } from './source';

interface HttpSourceOptions {
  fetchImpl?: typeof fetch;
  token?: TokenProvider;
}

export function createHttpSource(
  baseUrl: string,
  { fetchImpl, token = getAccessToken }: HttpSourceOptions = {},
): AnnouncementSource {
  return {
    /** Public search: never sends credentials. */
    search({ q, category, page, size }: SearchQuery) {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      if (q) {
        params.set('q', q);
      }
      if (category) {
        params.set('category', category);
      }
      return getJson<Page<AnnouncementSummary>>(`${baseUrl}/api/announcements/search?${params}`, { fetchImpl });
    },
    /** Protected from step 20: sends the signed-in user's access token. */
    getDetail(id: number) {
      return getJson<AnnouncementDetail>(`${baseUrl}/api/announcements/${id}`, { fetchImpl, token });
    },
  };
}
