import { useEffect, useState } from 'react';
import { nextShow, occurrences, statusAt, type MessageKey } from '@mtll/shared';
import { useContent } from '../state/content';
import { useSettings } from '../state/settings';

/**
 * UC06 Xem lịch diễn: đánh dấu suất đang diễn và suất tiếp theo, tự cập nhật mỗi phút.
 */
export function SchedulePage() {
  const { t, tl } = useSettings();
  const content = useContent();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const upcoming = nextShow(content, now);
  const todays = upcoming ? occurrences(content).filter((o) => o.day === upcoming.day) : [];

  return (
    <div className="stack">
      <p className="muted">{t('schedule.dailyHint')}</p>
      {content.shows.map((show) => {
        const occ = todays.find((o) => o.show.id === show.id);
        const status = occ ? statusAt(occ, now) : null;
        const isNext = upcoming?.show.id === show.id && upcoming.day === occ?.day;
        return (
          <section key={show.id} className={isNext ? 'card next' : 'card'}>
            <div className="row between">
              <span className="eyebrow">{t(`slot.${show.slot}` as MessageKey)}</span>
              {status === 'live' && <span className="live">{t('schedule.live')}</span>}
              {status === 'done' && <span className="muted">{t('schedule.done')}</span>}
              {status === 'upcoming' && isNext && <span className="live">{t('schedule.next')}</span>}
            </div>
            <span className="time">
              {show.start} – {show.end}
            </span>
            <h2>{tl(show.name)}</h2>
            <p className="muted">{tl(show.description)}</p>
          </section>
        );
      })}
    </div>
  );
}
