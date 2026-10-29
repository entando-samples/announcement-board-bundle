import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MfeConfig } from './config';
import type { ManagerSource } from './api/source';
import { API_CLAIM, ApiError, apiBaseUrl } from './api/http';
import { login, useAuth } from './auth/keycloak';
import { createHttpSource } from './api/httpSource';
import type { Announcement, AnnouncementInput, Page } from './types';
import AnnouncementTable from './components/AnnouncementTable';
import AnnouncementForm from './components/AnnouncementForm';

const PAGE_SIZE = 20;

interface AppProps {
  config: MfeConfig;
  source?: ManagerSource;
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Page<Announcement> };

type Editing = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; announcement: Announcement };

export default function App({ config, source: providedSource }: AppProps) {
  const baseUrl = apiBaseUrl(config);
  const source = useMemo(
    () => providedSource ?? (baseUrl ? createHttpSource(baseUrl) : undefined),
    [providedSource, baseUrl],
  );

  const auth = useAuth();
  const [sessionExpired, setSessionExpired] = useState(false);
  const handleUnauthorized = useCallback(() => setSessionExpired(true), []);

  if (!source) {
    return (
      <section className="announcement-manager" aria-label="Announcement manager">
        <p className="announcement-manager__error" role="alert">
          The announcement service is not configured (missing API claim “{API_CLAIM}”).
        </p>
      </section>
    );
  }
  // Signed out: render no data and call no API. The backend enforces this anyway.
  if (!auth.authenticated || sessionExpired) {
    return <SignInPanel available={auth.available} expired={sessionExpired} />;
  }
  // Keyed by user: signing in as someone else never shows the previous user's data.
  return (
    <Manager
      key={auth.username}
      source={source}
      username={auth.username}
      onUnauthorized={handleUnauthorized}
    />
  );
}

function SignInPanel({ available, expired }: { available: boolean; expired: boolean }) {
  return (
    <section className="announcement-manager" aria-label="Announcement manager">
      <h2>Manage announcements</h2>
      <p role="status">
        {expired ? 'Your session has expired. Sign in again to continue.' : 'Sign in to manage announcements.'}
      </p>
      {available ? (
        <button type="button" onClick={login}>
          Sign in
        </button>
      ) : (
        <p className="announcement-manager__error">Sign-in is not available on this page.</p>
      )}
    </section>
  );
}

interface ManagerProps {
  source: ManagerSource;
  username?: string;
  onUnauthorized: () => void;
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function Manager({ source, username, onUnauthorized }: ManagerProps) {
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [editing, setEditing] = useState<Editing>({ mode: 'closed' });
  const [notice, setNotice] = useState<string>();

  const reload = useCallback(() => {
    setList({ status: 'loading' });
    source
      .list(0, PAGE_SIZE)
      .then((data) => setList({ status: 'ready', data }))
      .catch((error: Error) => {
        if (isUnauthorized(error)) {
          onUnauthorized();
        }
        setList({ status: 'error', message: error.message });
      });
  }, [source, onUnauthorized]);

  useEffect(reload, [reload]);

  const save = async (input: AnnouncementInput) => {
    try {
      if (editing.mode === 'edit') {
        await source.update(editing.announcement.id, input);
        setNotice(`Updated "${input.title}".`);
      } else {
        await source.create(input);
        setNotice(`Created "${input.title}".`);
      }
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
      }
      throw error;
    }
    setEditing({ mode: 'closed' });
    reload();
  };

  const remove = async (announcement: Announcement) => {
    try {
      await source.remove(announcement.id);
      setNotice(`Deleted "${announcement.title}".`);
      reload();
    } catch (error) {
      if (isUnauthorized(error)) {
        onUnauthorized();
      }
      setNotice(`Delete failed: ${(error as Error).message}`);
    }
  };

  return (
    <section className="announcement-manager" aria-label="Announcement manager">
      <header className="announcement-manager__header">
        <h2>Manage announcements</h2>
        {username && <span className="announcement-manager__user">Signed in as {username}</span>}
        {editing.mode === 'closed' && (
          <button type="button" onClick={() => setEditing({ mode: 'create' })}>
            New announcement
          </button>
        )}
      </header>
      {notice && (
        <p className="announcement-manager__notice" role="status">
          {notice}
        </p>
      )}
      {editing.mode !== 'closed' && (
        <AnnouncementForm
          initial={editing.mode === 'edit' ? editing.announcement : undefined}
          onSubmit={save}
          onCancel={() => setEditing({ mode: 'closed' })}
        />
      )}
      {list.status === 'loading' && <p>Loading…</p>}
      {list.status === 'error' && (
        <p className="announcement-manager__error" role="alert">
          Announcements could not be loaded: {list.message}
        </p>
      )}
      {list.status === 'ready' && (
        <AnnouncementTable
          items={list.data.items}
          onEdit={(announcement) => setEditing({ mode: 'edit', announcement })}
          onDelete={remove}
        />
      )}
    </section>
  );
}
