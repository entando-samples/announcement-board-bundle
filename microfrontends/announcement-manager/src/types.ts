export const CATEGORIES = ['GENERAL', 'TRAINING', 'EVENT', 'MAINTENANCE'] as const;
export const STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];

export interface AnnouncementInput {
  title: string;
  summary: string;
  body: string;
  category: Category;
  status: Status;
}

export interface Announcement extends AnnouncementInput {
  id: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}
