import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { festival, rowsToContent, type Festival, type Stall, type Zone } from '@mtll/shared';
import { fetchContent, type Announcement } from '../lib/api';

interface ContentValue extends Festival {
  /** "db": đọc từ SQL Server qua API. "local": dùng dữ liệu mẫu có sẵn trong trang. */
  source: 'loading' | 'db' | 'local';
  announcement: Announcement | null;
  getStall: (id: string) => Stall | undefined;
  getZone: (id: string) => Zone | undefined;
}

const ContentContext = createContext<ContentValue | null>(null);

/**
 * Dùng chung cho UC02 đến UC07 và UC16 (dải thông báo khẩn).
 *
 * Nội dung lễ hội cho khách. Hiện ngay dữ liệu mẫu có sẵn, rồi thay bằng dữ liệu mới nhất trong database
 * nếu gọi được API. Thông báo khẩn được hỏi lại mỗi phút.
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Festival>(festival);
  const [source, setSource] = useState<ContentValue['source']>('loading');
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetchContent();
      if (!alive) return;
      if (!res || res.zones.length === 0) {
        setSource((s) => (s === 'db' ? s : 'local'));
        return;
      }
      const { zones, stalls, shows } = rowsToContent(res);
      setData({ ...festival, zones, stalls, shows });
      setAnnouncement(res.announcement?.active ? res.announcement : null);
      setSource('db');
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const getStall = useCallback((id: string) => data.stalls.find((s) => s.id === id), [data.stalls]);
  const getZone = useCallback((id: string) => data.zones.find((z) => z.id === id), [data.zones]);

  const value = useMemo(() => ({ ...data, source, announcement, getStall, getZone }), [data, source, announcement, getStall, getZone]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent phải được dùng bên trong ContentProvider');
  return ctx;
}
