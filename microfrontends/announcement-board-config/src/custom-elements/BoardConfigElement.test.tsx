import { act } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../params';
import { BoardConfigElement, ELEMENT_NAME } from './BoardConfigElement';

async function mount(config?: unknown) {
  const element = document.createElement(ELEMENT_NAME) as BoardConfigElement;
  await act(async () => {
    document.body.appendChild(element);
    if (config !== undefined) {
      element.config = config;
    }
  });
  return element;
}

describe('<announcement-board-config>', () => {
  it('returns the defaults when App Builder provides nothing', async () => {
    const element = await mount();
    expect(element.config).toEqual(DEFAULT_PARAMS);
    expect(screen.getByLabelText('Title')).toHaveValue('Announcements');
  });

  it('pre-fills the form from a saved configuration (setter)', async () => {
    await mount({ boardTitle: 'Course notices', pageSize: '5', defaultCategory: 'TRAINING', showSearchBox: 'false' });

    expect(screen.getByLabelText('Title')).toHaveValue('Course notices');
    expect(screen.getByLabelText('Results per page (1–50)')).toHaveValue(5);
    expect(screen.getByLabelText('Default category')).toHaveValue('TRAINING');
    expect(screen.getByLabelText('Show the free-text search box')).not.toBeChecked();
  });

  it('returns edited values to App Builder (getter)', async () => {
    const element = await mount();
    const title = screen.getByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, '  Notices  ');
    await userEvent.selectOptions(screen.getByLabelText('Default category'), 'EVENT');
    await userEvent.click(screen.getByLabelText('Show the free-text search box'));

    expect(element.config).toEqual({
      boardTitle: 'Notices',
      pageSize: '10',
      defaultCategory: 'EVENT',
      showSearchBox: 'false',
    });
  });

  it('shows errors and never returns an invalid value', async () => {
    const element = await mount({ pageSize: '20' });
    const size = screen.getByLabelText('Results per page (1–50)');
    await userEvent.clear(size);
    await userEvent.type(size, '99');

    expect(screen.getByText('Page size must be a whole number from 1 to 50.')).toBeInTheDocument();
    expect(size).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Invalid values are not saved');
    expect(element.config.pageSize).toBe('20');
  });

  it('replaces invalid saved values with defaults', async () => {
    const element = await mount({ pageSize: 'lots', defaultCategory: 'PARTY' });
    expect(element.config).toMatchObject({ pageSize: '10', defaultCategory: 'ALL' });
  });

  it('unmounts on disconnect', async () => {
    const element = await mount();
    await act(async () => element.remove());
    expect(element.childNodes).toHaveLength(0);
  });
});
