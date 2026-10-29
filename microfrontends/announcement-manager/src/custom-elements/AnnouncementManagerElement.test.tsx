import { act } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ELEMENT_NAME } from './AnnouncementManagerElement';

describe('<announcement-manager>', () => {
  it('mounts on connect and unmounts on disconnect', async () => {
    expect(customElements.get(ELEMENT_NAME)).toBeDefined();
    const element = document.createElement(ELEMENT_NAME);
    await act(async () => {
      document.body.appendChild(element);
    });
    expect(screen.getByRole('heading', { name: 'Manage announcements' })).toBeInTheDocument();

    await act(async () => {
      element.remove();
    });
    expect(element.childNodes).toHaveLength(0);
  });
});
