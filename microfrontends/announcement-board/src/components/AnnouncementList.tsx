import { useState } from 'react';
import type { AnnouncementDetail, AnnouncementSummary } from '../types';

interface AnnouncementListProps {
  items: AnnouncementSummary[];
  loadDetail: (id: number) => Promise<AnnouncementDetail>;
}

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; body: string };

export default function AnnouncementList({ items, loadDetail }: AnnouncementListProps) {
  const [details, setDetails] = useState<Record<number, DetailState>>({});

  if (items.length === 0) {
    return <p className="announcement-board__status">No announcements match your search.</p>;
  }

  const readMore = (id: number) => {
    setDetails((current) => ({ ...current, [id]: { status: 'loading' } }));
    loadDetail(id)
      .then((detail) => setDetails((current) => ({ ...current, [id]: { status: 'ready', body: detail.body } })))
      .catch((error: Error) =>
        setDetails((current) => ({ ...current, [id]: { status: 'error', message: error.message } })),
      );
  };

  return (
    <ul className="announcement-board__list">
      {items.map((item) => {
        const detail = details[item.id];
        return (
          <li key={item.id} className="announcement-board__item">
            <span className="announcement-board__category">{item.category}</span>
            <h3>{item.title}</h3>
            <time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString()}</time>
            <p>{item.summary}</p>
            {!detail && (
              <button type="button" onClick={() => readMore(item.id)}>
                Read more
              </button>
            )}
            {detail?.status === 'loading' && <p className="announcement-board__status">Loading…</p>}
            {detail?.status === 'error' && (
              <p className="announcement-board__status announcement-board__status--error" role="alert">
                {detail.message}
              </p>
            )}
            {detail?.status === 'ready' && <p className="announcement-board__body">{detail.body}</p>}
          </li>
        );
      })}
    </ul>
  );
}
