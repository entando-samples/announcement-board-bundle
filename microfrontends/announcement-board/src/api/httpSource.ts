import type { AnnouncementDetail, AnnouncementSummary, Page, SearchQuery } from '../types';
import { getJson } from './http';
import type { AnnouncementSource } from './source';

export function createHttpSource(baseUrl: string, fetchImpl: typeof fetch = fetch): AnnouncementSource {
  return {
    search({ q, category, page, size }: SearchQuery) {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      if (q) {
        params.set('q', q);
      }
      if (category) {
        params.set('category', category);
      }
      return getJson<Page<AnnouncementSummary>>(`${baseUrl}/api/announcements/search?${params}`, fetchImpl);
    },
    getDetail(id: number) {
      return getJson<AnnouncementDetail>(`${baseUrl}/api/announcements/${id}`, fetchImpl);
    },
  };
}
