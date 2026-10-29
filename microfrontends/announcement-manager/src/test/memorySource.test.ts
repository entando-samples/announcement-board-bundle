import { describe, expect, it } from 'vitest';
import { createMemorySource } from './memorySource';
import type { AnnouncementInput } from '../types';

const INPUT: AnnouncementInput = {
  title: 'Title',
  summary: 'Summary',
  body: 'Body',
  category: 'EVENT',
  status: 'DRAFT',
};

describe('memory source', () => {
  it('creates drafts without a publication date', async () => {
    const source = createMemorySource();
    const created = await source.create(INPUT);
    expect(created).toMatchObject({ id: 1, publishedAt: null, createdBy: 'anonymous' });
  });

  it('keeps the first publication date and clears it when unpublished', async () => {
    const source = createMemorySource();
    const { id } = await source.create({ ...INPUT, status: 'PUBLISHED' });
    const first = (await source.list(0, 10)).items[0].publishedAt;
    expect(first).not.toBeNull();

    const edited = await source.update(id, { ...INPUT, title: 'Edited', status: 'PUBLISHED' });
    expect(edited.publishedAt).toBe(first);

    const unpublished = await source.update(id, { ...INPUT, status: 'DRAFT' });
    expect(unpublished.publishedAt).toBeNull();
  });

  it('removes announcements and rejects updates of unknown ids', async () => {
    const source = createMemorySource();
    const { id } = await source.create(INPUT);
    await source.remove(id);
    expect((await source.list(0, 10)).totalItems).toBe(0);
    await expect(source.update(id, INPUT)).rejects.toThrow('not found');
  });
});
