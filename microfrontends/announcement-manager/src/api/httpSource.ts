import type { Announcement, AnnouncementInput, Page } from '../types';
import { requestJson } from './http';
import type { ManagerSource } from './source';

export function createHttpSource(baseUrl: string, fetchImpl: typeof fetch = fetch): ManagerSource {
  const collection = `${baseUrl}/api/announcements`;
  return {
    list(page, size) {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      return requestJson<Page<Announcement>>(`${collection}?${params}`, {}, fetchImpl);
    },
    create(input: AnnouncementInput) {
      return requestJson<Announcement>(collection, { method: 'POST', body: JSON.stringify(input) }, fetchImpl);
    },
    update(id, input) {
      return requestJson<Announcement>(
        `${collection}/${id}`,
        { method: 'PUT', body: JSON.stringify(input) },
        fetchImpl,
      );
    },
    remove(id) {
      return requestJson<void>(`${collection}/${id}`, { method: 'DELETE' }, fetchImpl);
    },
  };
}
