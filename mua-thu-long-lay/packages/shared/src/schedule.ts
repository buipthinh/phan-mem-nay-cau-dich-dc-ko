import type { Festival, Show } from './types';

export const REMINDER_MINUTES = 15;

export type ShowStatus = 'upcoming' | 'live' | 'done';

/** Thời điểm (Date) của một giờ HH:mm trong một ngày lễ hội, theo múi giờ của địa điểm. */
export function atFestivalTime(day: string, hhmm: string, utcOffset: string): Date {
  return new Date(`${day}T${hhmm}:00${utcOffset}`);
}

export interface ShowOccurrence {
  show: Show;
  day: string;
  start: Date;
  end: Date;
}

/** Tất cả các suất diễn của lễ hội, sắp theo thời gian. */
export function occurrences(f: Festival): ShowOccurrence[] {
  const list = f.days.flatMap((day) =>
    f.shows.map((show) => ({
      show,
      day,
      start: atFestivalTime(day, show.start, f.utcOffset),
      end: atFestivalTime(day, show.end, f.utcOffset),
    })),
  );
  return list.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function statusAt(o: ShowOccurrence, now: Date): ShowStatus {
  if (now < o.start) return 'upcoming';
  if (now < o.end) return 'live';
  return 'done';
}

/** Suất đang diễn hoặc suất kế tiếp; null khi lễ hội đã kết thúc. */
export function nextShow(f: Festival, now: Date): ShowOccurrence | null {
  return occurrences(f).find((o) => statusAt(o, now) !== 'done') ?? null;
}

/** Các mốc nhắc giờ (15 phút trước khi diễn) còn ở tương lai cho một suất diễn. */
export function reminderTimes(f: Festival, showId: string, now: Date): { day: string; at: Date }[] {
  return occurrences(f)
    .filter((o) => o.show.id === showId)
    .map((o) => ({ day: o.day, at: new Date(o.start.getTime() - REMINDER_MINUTES * 60_000) }))
    .filter((r) => r.at > now);
}
