import { CATEGORIES, type Category } from './types';

export interface SavedFilter {
  q: string;
  category?: Category;
}

const keyFor = (pageCode?: string) => `announcement-board.filter.${pageCode ?? 'default'}`;

/**
 * Last search per page, or undefined when none was saved. Browser storage may
 * be unavailable or tampered with, so failures count as "nothing saved".
 */
export function loadFilter(pageCode?: string): SavedFilter | undefined {
  try {
    const raw = window.localStorage.getItem(keyFor(pageCode));
    if (!raw) {
      return undefined;
    }
    const value = JSON.parse(raw) as Partial<SavedFilter>;
    const q = typeof value.q === 'string' ? value.q.slice(0, 100) : '';
    const category = CATEGORIES.find((c) => c === value.category);
    return { q, category };
  } catch {
    return undefined;
  }
}

export function saveFilter(filter: SavedFilter, pageCode?: string): void {
  try {
    window.localStorage.setItem(keyFor(pageCode), JSON.stringify(filter));
  } catch {
    // Storage disabled or full: the filter simply is not remembered.
  }
}
