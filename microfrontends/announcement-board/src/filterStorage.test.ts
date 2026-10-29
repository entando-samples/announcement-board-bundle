import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFilter, saveFilter } from './filterStorage';

afterEach(() => localStorage.clear());

describe('filter storage', () => {
  it('remembers the filter per page code', () => {
    saveFilter({ q: 'maintenance', category: 'MAINTENANCE' }, 'homepage');
    expect(loadFilter('homepage')).toEqual({ q: 'maintenance', category: 'MAINTENANCE' });
    expect(loadFilter('news')).toBeUndefined();
  });

  it('ignores corrupted or tampered values', () => {
    localStorage.setItem('announcement-board.filter.default', '{broken');
    expect(loadFilter()).toBeUndefined();
    localStorage.setItem('announcement-board.filter.default', JSON.stringify({ q: 5, category: 'NOPE' }));
    expect(loadFilter()).toEqual({ q: '', category: undefined });
  });

  it('survives unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied');
    });
    expect(() => saveFilter({ q: 'x' })).not.toThrow();
  });
});
