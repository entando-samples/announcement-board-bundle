import type { Announcement, AnnouncementInput, Page } from '../types';

export interface ManagerSource {
  list(page: number, size: number): Promise<Page<Announcement>>;
  create(input: AnnouncementInput): Promise<Announcement>;
  update(id: number, input: AnnouncementInput): Promise<Announcement>;
  remove(id: number): Promise<void>;
}
