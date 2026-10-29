import { useState } from 'react';
import { ApiError } from '../api/http';
import type { AnnouncementDetail, AnnouncementSummary } from '../types';

interface AnnouncementListProps {
  items: AnnouncementSummary[];
  locale: string;
  /** Full details are protected: signed-out users are asked to sign in instead. */
  authenticated: boolean;
  onSignIn: () => void;
  loadDetail: (id: number) => Promise<AnnouncementDetail>;
}

type DetailState =
  | { status: 'signInRequired' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; body: string };

export default function AnnouncementList({ items, locale, authenticated, onSignIn, loadDetail }: AnnouncementListProps) {
  const [details, setDetails] = useState<Record<number, DetailState>>({});
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  if (items.length === 0) {
    return <p className="announcement-board__status">No announcements match your search.</p>;
  }

  const readMore = (id: number) => {
    if (!authenticated) {
      setDetails((current) => ({ ...current, [id]: { status: 'signInRequired' } }));
      return;
    }
    setDetails((current) => ({ ...current, [id]: { status: 'loading' } }));
    loadDetail(id)
      .then((detail) => setDetails((current) => ({ ...current, [id]: { status: 'ready', body: detail.body } })))
      .catch((error: Error) =>
        setDetails((current) => ({
          ...current,
          [id]:
            error instanceof ApiError && error.status === 401
              ? { status: 'signInRequired' }
              : { status: 'error', message: error.message },
        })),
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
            <time dateTime={item.publishedAt}>{dateFormat.format(new Date(item.publishedAt))}</time>
            <p>{item.summary}</p>
            {!detail && (
              <button type="button" onClick={() => readMore(item.id)}>
                Read more
              </button>
            )}
            {detail?.status === 'signInRequired' && (
              <p className="announcement-board__signin">
                Sign in to read the full announcement.{' '}
                <button type="button" onClick={onSignIn}>
                  Sign in
                </button>
              </p>
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
