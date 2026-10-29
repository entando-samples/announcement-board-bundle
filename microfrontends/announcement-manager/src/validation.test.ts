import { describe, expect, it } from 'vitest';
import type { AnnouncementInput } from './types';
import { validateInput } from './validation';

const VALID: AnnouncementInput = {
  title: 'Valid title',
  summary: 'Short summary',
  body: 'Body text',
  category: 'GENERAL',
  status: 'DRAFT',
};

describe('validateInput', () => {
  it('accepts a valid announcement', () => {
    expect(validateInput(VALID)).toEqual({});
  });

  it.each([
    ['title', { title: 'ab' }],
    ['title', { title: 'x'.repeat(121) }],
    ['title', { title: '   ab   ' }],
    ['summary', { summary: '' }],
    ['summary', { summary: 'x'.repeat(281) }],
    ['body', { body: '  ' }],
    ['body', { body: 'x'.repeat(4001) }],
    ['category', { category: 'OTHER' }],
    ['status', { status: 'ARCHIVED' }],
  ])('rejects an invalid %s', (field, change) => {
    const errors = validateInput({ ...VALID, ...change } as AnnouncementInput);
    expect(Object.keys(errors)).toEqual([field]);
  });

  it('accepts boundary lengths', () => {
    const input = { ...VALID, title: 'x'.repeat(120), summary: 'x'.repeat(280), body: 'x'.repeat(4000) };
    expect(validateInput(input)).toEqual({});
  });
});
