import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
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

describe('board HTTP source with authentication', () => {
  it('never sends a token to the public search, even when one is available', async () => {
    let authorization: string | null = 'unset';
    server.use(
      http.get(`${BASE}/api/announcements/search`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ items: [], page: 0, size: 10, totalItems: 0, totalPages: 0 });
      }),
    );
    await createHttpSource(BASE, { token: async () => 'secret-token' }).search({ page: 0, size: 10 });
    expect(authorization).toBeNull();
  });

  it('sends the bearer token on the protected detail call', async () => {
    let authorization: string | null = null;
    server.use(
      http.get(`${BASE}/api/announcements/7`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ id: 7, body: 'b' });
      }),
    );
    await createHttpSource(BASE, { token: async () => 'token-1' }).getDetail(7);
    expect(authorization).toBe('Bearer token-1');
  });

  it('refreshes the token once after a 401 and retries', async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get(`${BASE}/api/announcements/7`, ({ request }) => {
        seen.push(request.headers.get('Authorization'));
        return seen.length === 1
          ? HttpResponse.json({ detail: 'expired' }, { status: 401 })
          : HttpResponse.json({ id: 7, body: 'b' });
      }),
    );
    const token = vi.fn(async (force?: boolean) => (force ? 'token-2' : 'token-1'));

    expect((await createHttpSource(BASE, { token }).getDetail(7)).body).toBe('b');
    expect(seen).toEqual(['Bearer token-1', 'Bearer token-2']);
    expect(token).toHaveBeenLastCalledWith(true);
  });

  it('gives up with a 401 ApiError after one retry', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/api/announcements/7`, () => {
        calls += 1;
        return HttpResponse.json({ detail: 'A valid bearer token is required.' }, { status: 401 });
      }),
    );
    await expect(createHttpSource(BASE, { token: async () => 'stale' }).getDetail(7)).rejects.toMatchObject({
      status: 401,
    });
    expect(calls).toBe(2);
  });

  it('sends no Authorization header when signed out', async () => {
    let authorization: string | null = 'unset';
    server.use(
      http.get(`${BASE}/api/announcements/7`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ detail: 'A valid bearer token is required.' }, { status: 401 });
      }),
    );
    await expect(createHttpSource(BASE, { token: async () => undefined }).getDetail(7)).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(authorization).toBeNull();
  });
});
