import { useEffect, useState } from 'react';
import type { MfeConfig } from './config';
import type { AnnouncementSource } from './api/source';
import { mockSource } from './api/mockSource';
import type { AnnouncementSummary, Category, Page } from './types';
import SearchForm from './components/SearchForm';
import AnnouncementList from './components/AnnouncementList';
import Pager from './components/Pager';

const PAGE_SIZE = 10;

interface AppProps {
  config: MfeConfig;
  source?: AnnouncementSource;
}

type Results =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Page<AnnouncementSummary> };

export default function App({ source = mockSource }: AppProps) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<Category | undefined>();
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<Results>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setResults({ status: 'loading' });
    source
      .search({ q, category, page, size: PAGE_SIZE })
      .then((data) => !cancelled && setResults({ status: 'ready', data }))
      .catch((error: Error) => !cancelled && setResults({ status: 'error', message: error.message }));
    return () => {
      cancelled = true;
    };
  }, [source, q, category, page]);

  return (
    <section className="announcement-board" aria-label="Announcements">
      <h2 className="announcement-board__title">Announcements</h2>
      <SearchForm
        initialText={q}
        category={category}
        onSearch={(text, selected) => {
          setQ(text);
          setCategory(selected);
          setPage(0);
        }}
      />
      {results.status === 'loading' && <p className="announcement-board__status">Loading…</p>}
      {results.status === 'error' && (
        <p className="announcement-board__status announcement-board__status--error" role="alert">
          Announcements could not be loaded: {results.message}
        </p>
      )}
      {results.status === 'ready' && (
        <>
          <AnnouncementList items={results.data.items} loadDetail={(id) => source.getDetail(id)} />
          <Pager page={results.data.page} totalPages={results.data.totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
}
