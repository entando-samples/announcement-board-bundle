import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MfeConfig } from './config';
import type { ManagerSource } from './api/source';
import { createMemorySource } from './api/memorySource';
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

export default function App({ source: providedSource }: AppProps) {
  const source = useMemo(() => providedSource ?? createMemorySource(), [providedSource]);
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [editing, setEditing] = useState<Editing>({ mode: 'closed' });
  const [notice, setNotice] = useState<string>();

  const reload = useCallback(() => {
    setList({ status: 'loading' });
    source
      .list(0, PAGE_SIZE)
      .then((data) => setList({ status: 'ready', data }))
      .catch((error: Error) => setList({ status: 'error', message: error.message }));
  }, [source]);

  useEffect(reload, [reload]);

  const save = async (input: AnnouncementInput) => {
    if (editing.mode === 'edit') {
      await source.update(editing.announcement.id, input);
      setNotice(`Updated "${input.title}".`);
    } else {
      await source.create(input);
      setNotice(`Created "${input.title}".`);
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
      setNotice(`Delete failed: ${(error as Error).message}`);
    }
  };

  return (
    <section className="announcement-manager" aria-label="Announcement manager">
      <header className="announcement-manager__header">
        <h2>Manage announcements</h2>
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
