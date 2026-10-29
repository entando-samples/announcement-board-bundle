import { act } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ELEMENT_NAME } from './AnnouncementBoardElement';

describe('<announcement-board>', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get(ELEMENT_NAME)).toBeDefined();
  });

  it('mounts on connect and re-renders when config changes', async () => {
    const element = document.createElement(ELEMENT_NAME);
    await act(async () => {
      document.body.appendChild(element);
    });
    expect(screen.getByRole('heading', { name: 'Announcements' })).toBeInTheDocument();

    await act(async () => {
      element.setAttribute('config', JSON.stringify({ params: {} }));
    });
    expect(screen.getByRole('heading', { name: 'Announcements' })).toBeInTheDocument();
  });

  it('unmounts and clears its content on disconnect', async () => {
    const element = document.createElement(ELEMENT_NAME);
    await act(async () => {
      document.body.appendChild(element);
    });
    await act(async () => {
      element.remove();
    });
    expect(element.childNodes).toHaveLength(0);
  });
});
