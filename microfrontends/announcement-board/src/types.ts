export const CATEGORIES = ['GENERAL', 'TRAINING', 'EVENT', 'MAINTENANCE'] as const;

export type Category = (typeof CATEGORIES)[number];

export interface AnnouncementSummary {
  id: number;
  title: string;
  summary: string;
  category: Category;
  publishedAt: string;
}

export interface AnnouncementDetail extends AnnouncementSummary {
  body: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface SearchQuery {
  q?: string;
  category?: Category;
  page: number;
  size: number;
}
