import { vi } from 'vitest';
import type { AnnouncementSource } from '../api/source';
import type { AnnouncementDetail, AnnouncementSummary, Page } from '../types';

export const SUMMARY: AnnouncementSummary = {
  id: 7,
  title: 'Cluster maintenance',
  summary: 'Saturday morning downtime.',
  category: 'MAINTENANCE',
  publishedAt: '2026-11-01T08:00:00Z',
};

export function pageOf(items: AnnouncementSummary[], page = 0, totalPages = 1): Page<AnnouncementSummary> {
  return { items, page, size: 10, totalItems: items.length, totalPages };
}

export function fakeSource() {
  return {
    search: vi.fn<AnnouncementSource['search']>().mockResolvedValue(pageOf([SUMMARY])),
    getDetail: vi
      .fn<AnnouncementSource['getDetail']>()
      .mockResolvedValue({ ...SUMMARY, body: 'Full maintenance details.' } satisfies AnnouncementDetail),
  };
}
