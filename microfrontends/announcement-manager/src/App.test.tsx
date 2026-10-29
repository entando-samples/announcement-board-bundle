import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createMemorySource } from './test/memorySource';
import type { ManagerSource } from './api/source';
import { ApiError } from './api/http';
import { removeKeycloak, signIn, signedOut } from './test/fakeKeycloak';

async function fillForm(title: string) {
  await userEvent.type(screen.getByLabelText('Title'), title);
  await userEvent.type(screen.getByLabelText('Summary'), 'A summary');
  await userEvent.type(screen.getByLabelText('Body'), 'A body');
}

describe('manager App (signed in)', () => {
  beforeEach(async () => {
    await signIn();
  });
  afterEach(removeKeycloak);

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
  beforeEach(async () => {
    await signIn();
  });
  afterEach(removeKeycloak);

  it('shows server-side field errors on the form', async () => {
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

describe('manager App authentication', () => {
  afterEach(removeKeycloak);

  it('shows a sign-in panel and calls no API when signed out', async () => {
    const keycloak = await signedOut();
    const source = createMemorySource();
    const list = vi.spyOn(source, 'list');
    render(<App config={{}} source={source} />);

    expect(screen.getByRole('status')).toHaveTextContent('Sign in to manage announcements.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(keycloak.login).toHaveBeenCalled();
  });

  it('explains that sign-in is unavailable when the page has no Keycloak', () => {
    removeKeycloak();
    render(<App config={{}} source={createMemorySource()} />);
    expect(screen.getByText('Sign-in is not available on this page.')).toBeInTheDocument();
  });

  it('shows the signed-in user', async () => {
    await signIn();
    render(<App config={{}} source={createMemorySource()} />);
    expect(await screen.findByText('Signed in as alice')).toBeInTheDocument();
  });

  it('switches to the expired-session panel when the API still answers 401', async () => {
    await signIn();
    const source: ManagerSource = {
      ...createMemorySource(),
      list: () => Promise.reject(new ApiError(401, 'A valid bearer token is required.')),
    };
    render(<App config={{}} source={source} />);

    expect(await screen.findByText('Your session has expired. Sign in again to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('hides the data as soon as the user signs out', async () => {
    await signIn();
    const source = createMemorySource();
    await source.create({ title: 'Visible', summary: 's', body: 'b', category: 'GENERAL', status: 'DRAFT' });
    render(<App config={{}} source={source} />);
    expect(await screen.findByRole('cell', { name: 'Visible' })).toBeInTheDocument();

    await signedOut();
    expect(screen.queryByRole('cell', { name: 'Visible' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Sign in to manage announcements.');
  });
});
