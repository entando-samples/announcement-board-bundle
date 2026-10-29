import { CATEGORIES, type Category } from './types';

export interface SavedFilter {
  q: string;
  category?: Category;
}

const keyFor = (pageCode?: string) => `announcement-board.filter.${pageCode ?? 'default'}`;

/** Last search per page; browser storage may be unavailable, so failures are ignored. */
export function loadFilter(pageCode?: string): SavedFilter {
  try {
    const raw = window.localStorage.getItem(keyFor(pageCode));
    const value = raw ? (JSON.parse(raw) as Partial<SavedFilter>) : {};
    const q = typeof value.q === 'string' ? value.q.slice(0, 100) : '';
    const category = CATEGORIES.find((c) => c === value.category);
    return { q, category };
  } catch {
    return { q: '' };
  }
}

export function saveFilter(filter: SavedFilter, pageCode?: string): void {
  try {
    window.localStorage.setItem(keyFor(pageCode), JSON.stringify(filter));
  } catch {
    // Storage disabled or full: the filter simply is not remembered.
  }
}
