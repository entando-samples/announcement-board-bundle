import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { AnnouncementInput } from '../types';
import { createHttpSource } from './httpSource';

const BASE = 'http://ms.test';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const source = createHttpSource(BASE);
const INPUT: AnnouncementInput = {
  title: 'Kick-off',
  summary: 'Starts at nine',
  body: 'Room 1',
  category: 'EVENT',
  status: 'DRAFT',
};

describe('manager HTTP source', () => {
  it('lists with paging parameters', async () => {
    server.use(
      http.get(`${BASE}/api/announcements`, ({ request }) => {
        const url = new URL(request.url);
        return HttpResponse.json({
          items: [],
          page: Number(url.searchParams.get('page')),
          size: Number(url.searchParams.get('size')),
          totalItems: 0,
          totalPages: 0,
        });
      }),
    );
    expect(await source.list(1, 20)).toMatchObject({ page: 1, size: 20 });
  });

  it('creates and updates with a JSON body', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${BASE}/api/announcements`, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toBe('application/json');
        bodies.push(await request.json());
        return HttpResponse.json({ ...INPUT, id: 1 }, { status: 201 });
      }),
      http.put(`${BASE}/api/announcements/1`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ ...INPUT, id: 1, status: 'PUBLISHED' });
      }),
    );

    expect((await source.create(INPUT)).id).toBe(1);
    expect((await source.update(1, { ...INPUT, status: 'PUBLISHED' })).status).toBe('PUBLISHED');
    expect(bodies).toEqual([INPUT, { ...INPUT, status: 'PUBLISHED' }]);
  });

  it('deletes and accepts an empty 204 response', async () => {
    server.use(http.delete(`${BASE}/api/announcements/1`, () => new HttpResponse(null, { status: 204 })));
    await expect(source.remove(1)).resolves.toBeUndefined();
  });

  it('exposes server validation errors by field', async () => {
    server.use(
      http.post(`${BASE}/api/announcements`, () =>
        HttpResponse.json(
          {
            status: 400,
            detail: 'Request validation failed',
            errors: [{ field: 'title', message: 'size must be between 3 and 120' }],
          },
          { status: 400 },
        ),
      ),
    );
    await expect(source.create(INPUT)).rejects.toMatchObject({
      status: 400,
      message: 'Request validation failed',
      fieldErrors: { title: 'size must be between 3 and 120' },
    });
  });

  it('reports 404 and 5xx errors', async () => {
    server.use(
      http.delete(`${BASE}/api/announcements/9`, () =>
        HttpResponse.json({ detail: 'Announcement 9 not found' }, { status: 404 }),
      ),
      http.get(`${BASE}/api/announcements`, () => new HttpResponse(null, { status: 500 })),
    );
    await expect(source.remove(9)).rejects.toMatchObject({ status: 404, message: 'Announcement 9 not found' });
    await expect(source.list(0, 20)).rejects.toMatchObject({ status: 500, message: 'HTTP 500' });
  });
});
