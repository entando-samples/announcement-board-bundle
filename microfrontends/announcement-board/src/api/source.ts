import type { AnnouncementDetail, AnnouncementSummary, Page, SearchQuery } from '../types';

export interface AnnouncementSource {
  search(query: SearchQuery): Promise<Page<AnnouncementSummary>>;
  getDetail(id: number): Promise<AnnouncementDetail>;
}
