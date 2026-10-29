import type { Announcement, AnnouncementInput, Page } from '../types';
import type { ManagerSource } from '../api/source';

// In-memory ManagerSource used as a test double.
export function createMemorySource(seed: Announcement[] = []): ManagerSource {
  let items = [...seed];
  let nextId = items.reduce((max, a) => Math.max(max, a.id), 0) + 1;

  const apply = (input: AnnouncementInput, previous?: Announcement): Announcement => {
    const now = new Date().toISOString();
    const publishedAt =
      input.status === 'PUBLISHED' ? (previous?.publishedAt ?? now) : null;
    return {
      id: previous?.id ?? nextId++,
      createdAt: previous?.createdAt ?? now,
      createdBy: previous?.createdBy ?? 'anonymous',
      ...input,
      publishedAt,
      updatedAt: now,
    };
  };

  return {
    async list(page, size): Promise<Page<Announcement>> {
      const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return {
        items: sorted.slice(page * size, page * size + size),
        page,
        size,
        totalItems: sorted.length,
        totalPages: Math.ceil(sorted.length / size),
      };
    },
    async create(input) {
      const created = apply(input);
      items = [...items, created];
      return created;
    },
    async update(id, input) {
      const previous = items.find((a) => a.id === id);
      if (!previous) {
        throw new Error(`Announcement ${id} not found`);
      }
      const updated = apply(input, previous);
      items = items.map((a) => (a.id === id ? updated : a));
      return updated;
    },
    async remove(id) {
      items = items.filter((a) => a.id !== id);
    },
  };
}
