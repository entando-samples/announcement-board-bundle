import { act } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ELEMENT_NAME } from './AnnouncementManagerElement';
import { removeKeycloak, signIn } from '../test/fakeKeycloak';

const CONFIG = JSON.stringify({ systemParams: { api: { 'announcement-api': { url: 'http://ms.test/' } } } });
const EMPTY_PAGE = { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 };

describe('<announcement-manager>', () => {
  it('reports a missing API claim', async () => {
    const element = document.createElement(ELEMENT_NAME);
    await act(async () => {
      document.body.appendChild(element);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('missing API claim “announcement-api”');
  });

  it('mounts with a configured claim and unmounts on disconnect', async () => {
    await signIn();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(EMPTY_PAGE)));
    vi.stubGlobal('fetch', fetchMock);
    const element = document.createElement(ELEMENT_NAME);
    element.setAttribute('config', CONFIG);
    await act(async () => {
      document.body.appendChild(element);
    });

    expect(screen.getByRole('heading', { name: 'Manage announcements' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe('http://ms.test/api/announcements?page=0&size=20');

    await act(async () => {
      element.remove();
    });
    expect(element.childNodes).toHaveLength(0);
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer token-1');
    vi.unstubAllGlobals();
    removeKeycloak();
  });
});
