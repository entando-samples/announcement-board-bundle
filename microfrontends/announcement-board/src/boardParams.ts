import { CATEGORIES, type Category } from './types';

/** Widget parameters set by page designers through announcement-board-config. */
export interface BoardParams {
  boardTitle: string;
  pageSize: number;
  defaultCategory?: Category;
  showSearchBox: boolean;
}

export const DEFAULT_PARAMS: BoardParams = {
  boardTitle: 'Announcements',
  pageSize: 10,
  defaultCategory: undefined,
  showSearchBox: true,
};

/**
 * Entando delivers params as strings. Each invalid or missing value falls back
 * to its default on its own, so one bad value never breaks the widget.
 */
export function parseBoardParams(params: Record<string, string> = {}): BoardParams {
  const result = { ...DEFAULT_PARAMS };
  const invalid = (key: string) => console.warn(`[announcement-board] invalid param "${key}", using default`);

  if (params.boardTitle !== undefined) {
    const title = String(params.boardTitle).trim();
    if (title.length >= 1 && title.length <= 80) {
      result.boardTitle = title;
    } else {
      invalid('boardTitle');
    }
  }
  if (params.pageSize !== undefined) {
    const size = Number(String(params.pageSize).trim());
    if (Number.isInteger(size) && size >= 1 && size <= 50) {
      result.pageSize = size;
    } else {
      invalid('pageSize');
    }
  }
  if (params.defaultCategory !== undefined && params.defaultCategory !== 'ALL') {
    const category = CATEGORIES.find((c) => c === params.defaultCategory);
    if (category) {
      result.defaultCategory = category;
    } else {
      invalid('defaultCategory');
    }
  }
  if (params.showSearchBox !== undefined) {
    if (params.showSearchBox === 'true' || params.showSearchBox === 'false') {
      result.showSearchBox = params.showSearchBox === 'true';
    } else {
      invalid('showSearchBox');
    }
  }
  return result;
}
