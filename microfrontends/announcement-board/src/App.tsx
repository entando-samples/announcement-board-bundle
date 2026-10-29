import { useEffect, useMemo, useState } from 'react';
import type { MfeConfig } from './config';
import type { AnnouncementSource } from './api/source';
import { API_CLAIM, apiBaseUrl } from './api/http';
import { createHttpSource } from './api/httpSource';
import { readContext, type BoardContext } from './context';
import { loadFilter, saveFilter } from './filterStorage';
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

export default function App({ config, source: providedSource }: AppProps) {
  const baseUrl = apiBaseUrl(config);
  const { pageCode, locale } = readContext(config);
  const source = useMemo(
    () => providedSource ?? (baseUrl ? createHttpSource(baseUrl) : undefined),
    [providedSource, baseUrl],
  );

  if (!source) {
    return (
      <section className="announcement-board" aria-label="Announcements">
        <p className="announcement-board__status announcement-board__status--error" role="alert">
          The announcement service is not configured (missing API claim “{API_CLAIM}”).
        </p>
      </section>
    );
  }
  // Keyed by page so each placement keeps its own remembered filter.
  return <Board key={pageCode ?? ''} source={source} context={{ pageCode, locale }} />;
}

function Board({ source, context }: { source: AnnouncementSource; context: BoardContext }) {
  const [initial] = useState(() => loadFilter(context.pageCode));
  const [q, setQ] = useState(initial.q);
  const [category, setCategory] = useState<Category | undefined>(initial.category);
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
    <section className="announcement-board" aria-label="Announcements" data-page-code={context.pageCode}>
      <h2 className="announcement-board__title">Announcements</h2>
      <SearchForm
        initialText={q}
        category={category}
        onSearch={(text, selected) => {
          setQ(text);
          setCategory(selected);
          setPage(0);
          saveFilter({ q: text, category: selected }, context.pageCode);
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
          <AnnouncementList
            items={results.data.items}
            locale={context.locale}
            loadDetail={(id) => source.getDetail(id)}
          />
          <Pager page={results.data.page} totalPages={results.data.totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
}
