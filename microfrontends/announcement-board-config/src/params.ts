/** Same rules as announcement-board's parseBoardParams; values are strings. */
export const PARAM_NAMES = ['boardTitle', 'pageSize', 'defaultCategory', 'showSearchBox'] as const;

export type ParamName = (typeof PARAM_NAMES)[number];
export type BoardParams = Record<ParamName, string>;

export const CATEGORY_OPTIONS = ['ALL', 'GENERAL', 'TRAINING', 'EVENT', 'MAINTENANCE'] as const;

export const DEFAULT_PARAMS: BoardParams = {
  boardTitle: 'Announcements',
  pageSize: '10',
  defaultCategory: 'ALL',
  showSearchBox: 'true',
};

/** Returns an error message, or undefined when the value is valid. */
export function validateParam(name: ParamName, value: string): string | undefined {
  switch (name) {
    case 'boardTitle': {
      const length = value.trim().length;
      return length >= 1 && length <= 80 ? undefined : 'Title must be 1 to 80 characters.';
    }
    case 'pageSize': {
      const size = Number(value.trim());
      return value.trim() !== '' && Number.isInteger(size) && size >= 1 && size <= 50
        ? undefined
        : 'Page size must be a whole number from 1 to 50.';
    }
    case 'defaultCategory':
      return (CATEGORY_OPTIONS as readonly string[]).includes(value) ? undefined : 'Choose a category.';
    case 'showSearchBox':
      return value === 'true' || value === 'false' ? undefined : 'Must be true or false.';
  }
}

export type ParamErrors = Partial<Record<ParamName, string>>;

export function validateParams(values: BoardParams): ParamErrors {
  const errors: ParamErrors = {};
  for (const name of PARAM_NAMES) {
    const error = validateParam(name, values[name]);
    if (error) {
      errors[name] = error;
    }
  }
  return errors;
}

/** Normalises whatever App Builder hands over into a complete set of strings. */
export function normalizeParams(input: unknown): BoardParams {
  const source = input !== null && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const result = { ...DEFAULT_PARAMS };
  for (const name of PARAM_NAMES) {
    const value = source[name];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[name] = String(value);
    }
  }
  return result;
}
