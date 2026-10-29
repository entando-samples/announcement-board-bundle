import { CATEGORIES, STATUSES, type AnnouncementInput } from './types';

export type FieldErrors = Partial<Record<keyof AnnouncementInput, string>>;

// Mirrors the server-side rules of announcement-ms (doc/api/announcement-api.md).
export function validateInput(input: AnnouncementInput): FieldErrors {
  const errors: FieldErrors = {};
  const title = input.title.trim();
  if (title.length < 3 || title.length > 120) {
    errors.title = 'Title must be 3 to 120 characters.';
  }
  const summary = input.summary.trim();
  if (summary.length === 0 || summary.length > 280) {
    errors.summary = 'Summary is required and must be at most 280 characters.';
  }
  const body = input.body.trim();
  if (body.length === 0 || body.length > 4000) {
    errors.body = 'Body is required and must be at most 4000 characters.';
  }
  if (!CATEGORIES.includes(input.category)) {
    errors.category = 'Choose a category.';
  }
  if (!STATUSES.includes(input.status)) {
    errors.status = 'Choose a status.';
  }
  return errors;
}
