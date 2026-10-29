import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, apiBaseUrl } from './http';
import { createHttpSource } from './httpSource';

const BASE = 'http://ms.test/training26/announcement-ms';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const source = createHttpSource(BASE);

describe('apiBaseUrl', () => {
  it('reads the announcement-api claim and drops trailing slashes', () => {
    expect(apiBaseUrl({ systemParams: { api: { 'announcement-api': { url: `${BASE}//` } } } })).toBe(BASE);
  });

  it('is undefined when the claim is missing or blank', () => {
    expect(apiBaseUrl({})).toBeUndefined();
    expect(apiBaseUrl({ systemParams: { api: { other: { url: BASE } } } })).toBeUndefined();
    expect(apiBaseUrl({ systemParams: { api: { 'announcement-api': { url: ' ' } } } })).toBeUndefined();
  });
});

describe('board HTTP source', () => {
  it('calls the public search endpoint with only the given filters', async () => {
    let received: URL | undefined;
    server.use(
      http.get(`${BASE}/api/announcements/search`, ({ request }) => {
        received = new URL(request.url);
        return HttpResponse.json({ items: [], page: 2, size: 5, totalItems: 0, totalPages: 0 });
      }),
    );

    const page = await source.search({ q: 'maintenance', page: 2, size: 5 });

    expect(page.page).toBe(2);
    expect(Object.fromEntries(received!.searchParams)).toEqual({ q: 'maintenance', page: '2', size: '5' });
  });

  it('sends no Authorization header on search', async () => {
    let authorization: string | null = 'unset';
    server.use(
      http.get(`${BASE}/api/announcements/search`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ items: [], page: 0, size: 10, totalItems: 0, totalPages: 0 });
      }),
    );
    await source.search({ page: 0, size: 10 });
    expect(authorization).toBeNull();
  });

  it('loads the detail of one announcement', async () => {
    server.use(
      http.get(`${BASE}/api/announcements/7`, () =>
        HttpResponse.json({ id: 7, title: 't', summary: 's', body: 'b', category: 'EVENT', publishedAt: null }),
      ),
    );
    expect((await source.getDetail(7)).body).toBe('b');
  });

  it('turns Problem Details into an ApiError with the server detail', async () => {
    server.use(
      http.get(`${BASE}/api/announcements/9`, () =>
        HttpResponse.json({ status: 404, detail: 'Announcement 9 not found' }, { status: 404 }),
      ),
    );
    await expect(source.getDetail(9)).rejects.toMatchObject({ status: 404, message: 'Announcement 9 not found' });
  });

  it('falls back to the status code for non-JSON errors', async () => {
    server.use(http.get(`${BASE}/api/announcements/search`, () => new HttpResponse('down', { status: 503 })));
    await expect(source.search({ page: 0, size: 10 })).rejects.toMatchObject({ status: 503, message: 'HTTP 503' });
  });

  it('reports network failures as unreachable', async () => {
    server.use(http.get(`${BASE}/api/announcements/search`, () => HttpResponse.error()));
    const error = await source.search({ page: 0, size: 10 }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, message: 'The announcement service is unreachable.' });
  });
});
