import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { fakeSource, pageOf, SUMMARY } from './test/fakeSource';

describe('board App', () => {
  it('shows loading, then the search results', async () => {
    render(<App config={{}} source={fakeSource()} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: SUMMARY.title })).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.summary)).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    const source = fakeSource();
    source.search.mockResolvedValue(pageOf([]));
    render(<App config={{}} source={source} />);
    expect(await screen.findByText('No announcements match your search.')).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    const source = fakeSource();
    source.search.mockRejectedValue(new Error('HTTP 503'));
    render(<App config={{}} source={source} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 503');
  });

  it('searches with the entered text and category from the first page', async () => {
    const source = fakeSource();
    render(<App config={{}} source={source} />);
    await screen.findByRole('heading', { name: SUMMARY.title });

    await userEvent.type(screen.getByLabelText('Search text'), '  maintenance ');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'MAINTENANCE');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(source.search).toHaveBeenLastCalledWith({ q: 'maintenance', category: 'MAINTENANCE', page: 0, size: 10 });
  });

  it('loads the full body on "Read more"', async () => {
    const source = fakeSource();
    render(<App config={{}} source={source} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Read more' }));

    expect(await screen.findByText('Full maintenance details.')).toBeInTheDocument();
    expect(source.getDetail).toHaveBeenCalledWith(SUMMARY.id);
  });

  it('pages through results', async () => {
    const source = fakeSource();
    source.search.mockResolvedValue(pageOf([SUMMARY], 0, 3));
    render(<App config={{}} source={source} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Next' }));

    expect(source.search).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });
});
