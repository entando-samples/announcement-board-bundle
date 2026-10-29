import { act } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ELEMENT_NAME } from './AnnouncementBoardElement';

const CONFIG = JSON.stringify({ systemParams: { api: { 'announcement-api': { url: 'http://ms.test' } } } });
const EMPTY_PAGE = { items: [], page: 0, size: 10, totalItems: 0, totalPages: 0 };

async function mount(config?: string) {
  const element = document.createElement(ELEMENT_NAME);
  if (config) {
    element.setAttribute('config', config);
  }
  await act(async () => {
    document.body.appendChild(element);
  });
  return element;
}

describe('<announcement-board>', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get(ELEMENT_NAME)).toBeDefined();
  });

  it('reports a missing API claim', async () => {
    await mount();
    expect(screen.getByRole('alert')).toHaveTextContent('missing API claim “announcement-api”');
  });

  it('calls the claim URL and re-renders when config changes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(EMPTY_PAGE)));
    vi.stubGlobal('fetch', fetchMock);
    const element = await mount();

    await act(async () => {
      element.setAttribute('config', CONFIG);
    });

    expect(screen.getByRole('heading', { name: 'Announcements' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://ms.test/api/announcements/search?page=0&size=10',
      expect.anything(),
    );
    vi.unstubAllGlobals();
  });

  it('unmounts and clears its content on disconnect', async () => {
    const element = await mount();
    await act(async () => {
      element.remove();
    });
    expect(element.childNodes).toHaveLength(0);
  });
});
