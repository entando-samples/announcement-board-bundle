import type { AnnouncementDetail, Page, SearchQuery, AnnouncementSummary } from '../types';
import type { AnnouncementSource } from './source';

// Static data used until the board is connected to announcement-ms (step 13).
const ANNOUNCEMENTS: AnnouncementDetail[] = [
  {
    id: 1,
    title: 'Welcome to the Entando developer training',
    summary: 'Day 2 covers bundles, micro frontends and microservices.',
    body: 'Bring a laptop with Docker, JDK 17 and Node.js 20 installed.',
    category: 'TRAINING',
    publishedAt: '2026-11-02T08:30:00Z',
  },
  {
    id: 2,
    title: 'Planned maintenance of the training cluster',
    summary: 'The cluster is unavailable on Saturday from 08:00 to 12:00 UTC.',
    body: 'Deployments started before the window are kept; new installs are blocked.',
    category: 'MAINTENANCE',
    publishedAt: '2026-11-01T16:00:00Z',
  },
  {
    id: 3,
    title: 'Community meetup',
    summary: 'Join the Entando community meetup after the course.',
    body: 'Talks on micro frontends, Keycloak and multitenancy.',
    category: 'EVENT',
    publishedAt: '2026-10-30T10:00:00Z',
  },
];

function toSummary({ body: _body, ...summary }: AnnouncementDetail): AnnouncementSummary {
  return summary;
}

export const mockSource: AnnouncementSource = {
  async search({ q, category, page, size }: SearchQuery): Promise<Page<AnnouncementSummary>> {
    const text = q?.trim().toLowerCase() ?? '';
    const matches = ANNOUNCEMENTS.filter(
      (a) =>
        (!category || a.category === category) &&
        (!text || a.title.toLowerCase().includes(text) || a.summary.toLowerCase().includes(text)),
    );
    return {
      items: matches.slice(page * size, page * size + size).map(toSummary),
      page,
      size,
      totalItems: matches.length,
      totalPages: Math.ceil(matches.length / size),
    };
  },
  async getDetail(id: number): Promise<AnnouncementDetail> {
    const found = ANNOUNCEMENTS.find((a) => a.id === id);
    if (!found) {
      throw new Error(`Announcement ${id} not found`);
    }
    return found;
  },
};
