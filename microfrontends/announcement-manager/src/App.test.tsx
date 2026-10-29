import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { createMemorySource } from './test/memorySource';
import type { ManagerSource } from './api/source';

async function fillForm(title: string) {
  await userEvent.type(screen.getByLabelText('Title'), title);
  await userEvent.type(screen.getByLabelText('Summary'), 'A summary');
  await userEvent.type(screen.getByLabelText('Body'), 'A body');
}

describe('manager App', () => {
  it('shows the empty state', async () => {
    render(<App config={{}} source={createMemorySource()} />);
    expect(await screen.findByText('No announcements yet. Create the first one.')).toBeInTheDocument();
  });

  it('shows field errors and does not save an invalid announcement', async () => {
    const source = createMemorySource();
    render(<App config={{}} source={source} />);
    await userEvent.click(await screen.findByRole('button', { name: 'New announcement' }));
    await userEvent.type(screen.getByLabelText('Title'), 'ab');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Title must be 3 to 120 characters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect((await source.list(0, 10)).totalItems).toBe(0);
  });

  it('creates, edits and deletes an announcement', async () => {
    render(<App config={{}} source={createMemorySource()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'New announcement' }));
    await fillForm('Kick-off');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'PUBLISHED');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    const row = (await screen.findByRole('cell', { name: 'Kick-off' })).closest('tr')!;
    expect(within(row).getByText('PUBLISHED')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Created "Kick-off".');

    await userEvent.click(screen.getByRole('button', { name: 'Edit Kick-off' }));
    const title = screen.getByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Kick-off moved');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('cell', { name: 'Kick-off moved' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Kick-off moved' }));
    expect(await screen.findByText('No announcements yet. Create the first one.')).toBeInTheDocument();
  });

  it('shows the error state when the list cannot be loaded', async () => {
    const failing: ManagerSource = { ...createMemorySource(), list: () => Promise.reject(new Error('HTTP 500')) };
    render(<App config={{}} source={failing} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 500');
  });

  it('keeps the form open and reports a failed save', async () => {
    const failing: ManagerSource = { ...createMemorySource(), create: () => Promise.reject(new Error('HTTP 400')) };
    render(<App config={{}} source={failing} />);
    await userEvent.click(await screen.findByRole('button', { name: 'New announcement' }));
    await fillForm('Valid title');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 400');
    expect(screen.getByLabelText('Title')).toHaveValue('Valid title');
  });
});

describe('manager App with server validation', () => {
  it('shows server-side field errors on the form', async () => {
    const { ApiError } = await import('./api/http');
    const rejecting: ManagerSource = {
      ...createMemorySource(),
      create: () =>
        Promise.reject(new ApiError(400, 'Request validation failed', { summary: 'must not be blank' })),
    };
    render(<App config={{}} source={rejecting} />);
    await userEvent.click(await screen.findByRole('button', { name: 'New announcement' }));
    await fillForm('Valid title');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('must not be blank')).toBeInTheDocument();
    expect(screen.getByLabelText('Summary')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Request validation failed');
  });
});
