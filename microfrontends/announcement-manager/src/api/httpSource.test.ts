import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AnnouncementInput } from '../types';
import { createHttpSource } from './httpSource';

const BASE = 'http://ms.test';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const source = createHttpSource(BASE, { token: async () => 'token-1' });
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

describe('manager HTTP source authentication', () => {
  it('sends the bearer token on every operation', async () => {
    const seen: (string | null)[] = [];
    const record = ({ request }: { request: Request }) => {
      seen.push(request.headers.get('Authorization'));
      return request.method === 'DELETE'
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json({ ...INPUT, id: 1, items: [] });
    };
    server.use(
      http.get(`${BASE}/api/announcements`, record),
      http.post(`${BASE}/api/announcements`, record),
      http.put(`${BASE}/api/announcements/1`, record),
      http.delete(`${BASE}/api/announcements/1`, record),
    );

    await source.list(0, 20);
    await source.create(INPUT);
    await source.update(1, INPUT);
    await source.remove(1);
    expect(seen).toEqual(Array(4).fill('Bearer token-1'));
  });

  it('refreshes once after a 401, then reports 401', async () => {
    let calls = 0;
    server.use(
      http.delete(`${BASE}/api/announcements/1`, () => {
        calls += 1;
        return HttpResponse.json({ detail: 'A valid bearer token is required.' }, { status: 401 });
      }),
    );
    const token = vi.fn(async (force?: boolean) => (force ? 'token-2' : 'token-1'));

    await expect(createHttpSource(BASE, { token }).remove(1)).rejects.toMatchObject({ status: 401 });
    expect(calls).toBe(2);
    expect(token).toHaveBeenLastCalledWith(true);
  });
});
