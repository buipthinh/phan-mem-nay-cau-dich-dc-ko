import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  festival,
  LANGS,
  rowsToContent,
  showToRow,
  stallToRow,
  translationRows,
  zoneToRow,
  type ContentRows,
  type Entity,
  type Lang,
  type Localized,
  type Show,
  type Stall,
  type Zone,
} from '@mtll/shared';
import { api, ApiError } from './api';
import { useAuth } from './auth';

/** Trạng thái bản dịch của một nội dung ở một ngôn ngữ. */
export type TranslationStatus = 'missing' | 'draft' | 'approved' | 'outdated';

export interface AdminData {
  zones: Zone[];
  stalls: Stall[];
  shows: Show[];
  /** Trạng thái dịch theo khoá "stall:F1" hoặc "zone:A", rồi theo ngôn ngữ. */
  translation: Record<string, Partial<Record<Lang, TranslationStatus>>>;
  /** Thông báo khẩn hiện trên đầu web khách (vd. phương án trời mưa). */
  announcement: { text: string; active: boolean };
  /** Lần sửa gần nhất của mỗi điểm, theo khoá "zone:A" / "stall:F1" (chuỗi ngày giờ ISO). */
  updated?: Record<string, string>;
}

/** Một điểm thuyết minh: một khu (đọc theo vùng GPS) hoặc một gian hàng (đọc khi quét QR). */
export type Point = { type: 'zone'; key: string; item: Zone } | { type: 'stall'; key: string; item: Stall };

/** Gộp khu và gian hàng thành một danh sách điểm thuyết minh (khu trước, gian sau). */
export function listPoints(data: AdminData): Point[] {
  return [
    ...data.zones.map((z) => ({ type: 'zone' as const, key: `zone:${z.id}`, item: z })),
    ...data.stalls.map((s) => ({ type: 'stall' as const, key: `stall:${s.id}`, item: s })),
  ];
}

const STORAGE_KEY = 'mtll-admin-v2';

/** Dữ liệu mẫu ban đầu: bản tiếng Anh coi như đã duyệt, tiếng Trung, Hàn, Nhật, Đức còn thiếu. */
export function seedData(): AdminData {
  const translation: AdminData['translation'] = {};
  const mark = (key: string, value: Localized) => {
    translation[key] = {
      en: value.en ? 'approved' : 'missing',
      zh: value.zh ? 'approved' : 'missing',
      ko: value.ko ? 'approved' : 'missing',
      ja: value.ja ? 'approved' : 'missing',
      de: value.de ? 'approved' : 'missing',
    };
  };
  for (const s of festival.stalls) mark(`stall:${s.id}`, s.description);
  for (const z of festival.zones) mark(`zone:${z.id}`, z.narration);
  return {
    zones: structuredClone(festival.zones),
    stalls: structuredClone(festival.stalls),
    shows: structuredClone(festival.shows),
    translation,
    updated: {},
    announcement: {
      text: 'Trời đang mưa: các suất diễn chuyển vào nhà bạt cạnh Quảng trường Lá Phong.',
      active: false,
    },
  };
}

/** Chế độ demo (không có API): lưu tạm trên trình duyệt bằng localStorage. */
function load(): AdminData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdminData;
  } catch {
    /* dữ liệu hỏng hoặc trình duyệt chặn localStorage: dùng dữ liệu mẫu */
  }
  return seedData();
}

function save(data: AdminData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* bỏ qua khi không lưu được */
  }
}

/** Khi bản tiếng Việt gốc đổi, mọi bản dịch đã có của nội dung đó cần dịch lại. */
export function markOutdated(statuses: Partial<Record<Lang, TranslationStatus>> = {}) {
  const next: Partial<Record<Lang, TranslationStatus>> = {};
  for (const [lang, st] of Object.entries(statuses) as [Lang, TranslationStatus][]) next[lang] = st === 'missing' ? 'missing' : 'outdated';
  return next;
}

/** Ngôn ngữ cần dịch (mọi ngôn ngữ trừ tiếng Việt gốc). */
const TARGET_LANGS = LANGS.map((l) => l.code).filter((c): c is Exclude<Lang, 'vi'> => c !== 'vi');

/** Đổi dữ liệu đọc từ SQL Server (GET /api/admin/content) sang dạng web quản trị dùng. */
function fromDatabase(res: ContentRows & { announcement: { text_vi: string; active: boolean } | null }): AdminData {
  const { zones, stalls, shows, statuses, updated } = rowsToContent(res);
  const translation: AdminData['translation'] = {};
  for (const key of [...zones.map((z) => `zone:${z.id}`), ...stalls.map((s) => `stall:${s.id}`)]) {
    translation[key] = Object.fromEntries(TARGET_LANGS.map((l) => [l, statuses[key]?.[l] ?? 'missing']));
  }
  return {
    zones,
    stalls,
    shows,
    translation,
    updated,
    announcement: { text: res.announcement?.text_vi ?? '', active: Boolean(res.announcement?.active) },
  };
}

/** Ghi một nội dung đã sửa (khoá dạng "stall:F1", "zone:A", "show:S1" hoặc "announcement") xuống SQL Server qua API. */
async function push(key: string, data: AdminData, token: string) {
  if (key === 'announcement') {
    await api('/announcement', { method: 'PUT', token, body: { text_vi: data.announcement.text, active: data.announcement.active } });
    return;
  }
  const [entity, id] = key.split(':') as [Entity, string];
  const statuses = data.translation[key];
  const item =
    entity === 'stall'
      ? data.stalls.find((s) => s.id === id)
      : entity === 'zone'
        ? data.zones.find((z) => z.id === id)
        : data.shows.find((s) => s.id === id);
  if (!item) {
    // Không còn trong danh sách nghĩa là vừa bị xoá.
    if (entity === 'stall') await api(`/stalls/${id}`, { method: 'DELETE', token });
    return;
  }
  const row = entity === 'stall' ? stallToRow(item as Stall) : entity === 'zone' ? zoneToRow(item as Zone) : showToRow(item as Show);
  await api(`/${entity}s/${id}`, { method: 'PUT', token, body: row });
  const rows = translationRows(entity, item as unknown as Record<string, unknown> & { id: string }, statuses);
  if (rows.length) await api('/translations', { method: 'PUT', token, body: rows });
}

export type SyncState =
  { state: 'local' } | { state: 'loading' } | { state: 'saved' } | { state: 'saving' } | { state: 'error'; message: string };

/**
 * Các việc web quản trị làm với dữ liệu. Mỗi hàm đổi dữ liệu trên màn hình ngay, rồi tự ghi xuống SQL Server.
 */
interface StoreValue {
  data: AdminData;
  /** UC12: sửa một gian. viChanged = true khi sửa chữ tiếng Việt, các bản dịch sẽ thành "Cần dịch lại". */
  updateStall: (stall: Stall, viChanged: boolean) => void;
  /** UC12: thêm gian mới (chưa có bản dịch nào). */
  addStall: (stall: Stall) => void;
  /** UC12: xoá gian. */
  removeStall: (id: string) => void;
  /** UC11: sửa một khu (tên, thuyết minh, toạ độ GPS, bán kính). */
  updateZone: (zone: Zone, viChanged: boolean) => void;
  /** UC14: sửa một suất diễn. */
  updateShow: (show: Show) => void;
  /** UC13: đổi trạng thái bản dịch (nháp, đã duyệt, cần dịch lại). */
  setTranslation: (key: string, lang: Lang, status: TranslationStatus) => void;
  /** UC13: ghi chữ đã dịch của một điểm ("zone:A", "stall:F1") ở một ngôn ngữ, kèm trạng thái mới. */
  setPointTexts: (key: string, lang: Exclude<Lang, 'vi'>, changes: Record<string, string>, status: TranslationStatus) => void;
  /** UC11, UC12: ẩn / hiện một điểm với khách. */
  setPublished: (key: string, published: boolean) => void;
  /** UC16: sửa nội dung hoặc bật/tắt thông báo khẩn. */
  setAnnouncement: (a: AdminData['announcement']) => void;
  /** Có SQL Server: đọc lại từ database. Chế độ demo: về dữ liệu mẫu. */
  reset: () => void;
  /** Tình trạng lưu vào SQL Server, hiện ở góc trang. */
  sync: SyncState;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [data, setData] = useState<AdminData>(load);
  const [sync, setSync] = useState<SyncState>(token ? { state: 'loading' } : { state: 'local' });
  // Các nội dung đã sửa nhưng chưa ghi xuống database.
  const dirty = useRef(new Set<string>());
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
    if (!token) save(data);
  }, [data, token]);

  // Có API: đọc toàn bộ dữ liệu từ SQL Server.
  const loadFromDb = useCallback(async () => {
    if (!token) return;
    setSync({ state: 'loading' });
    try {
      const res = await api<Parameters<typeof fromDatabase>[0]>('/admin/content', { token });
      dirty.current.clear();
      setData(fromDatabase(res));
      setSync({ state: 'saved' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
      else setSync({ state: 'error', message: (err as Error).message });
    }
  }, [token, logout]);

  useEffect(() => {
    // Gọi sau một nhịp để không đặt state ngay trong effect.
    const timer = setTimeout(loadFromDb, 0);
    return () => clearTimeout(timer);
  }, [loadFromDb]);

  // Ghi các nội dung đã sửa xuống database, từng cái một.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busy = useRef(false);
  const flushRef = useRef<() => Promise<void>>(async () => undefined);
  const flush = useCallback(async () => {
    if (!token) return;
    // Đang ghi dở thì thử lại sau một chút.
    if (busy.current) {
      timer.current = setTimeout(() => flushRef.current(), 300);
      return;
    }
    busy.current = true;
    setSync({ state: 'saving' });
    let keys: string[] = [];
    try {
      while (dirty.current.size) {
        keys = [...dirty.current];
        dirty.current.clear();
        for (const key of keys) await push(key, dataRef.current, token);
      }
      setSync({ state: 'saved' });
    } catch (err) {
      keys.forEach((k) => dirty.current.add(k));
      if (err instanceof ApiError && err.status === 401) logout();
      else setSync({ state: 'error', message: (err as Error).message });
    } finally {
      busy.current = false;
    }
  }, [token, logout]);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  /** Đánh dấu nội dung vừa sửa. Gõ liên tục thì chỉ ghi một lần, sau khi dừng tay 0,6 giây. */
  const mark = useCallback(
    (...keys: string[]) => {
      if (!token) return;
      keys.forEach((k) => dirty.current.add(k));
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    },
    [token, flush],
  );

  /** Sửa dữ liệu của một nội dung: ghi giờ sửa, rồi hẹn ghi xuống database. */
  const edit = useCallback(
    (key: string, change: (d: AdminData) => AdminData) => {
      mark(key);
      setData((d) => ({ ...change(d), updated: { ...d.updated, [key]: new Date().toISOString() } }));
    },
    [mark],
  );

  const setTranslation = useCallback(
    (key: string, lang: Lang, status: TranslationStatus) =>
      edit(key, (d) => ({ ...d, translation: { ...d.translation, [key]: { ...d.translation[key], [lang]: status } } })),
    [edit],
  );

  const value = useMemo<StoreValue>(
    () => ({
      data,
      sync,
      updateStall: (stall, viChanged) =>
        edit(`stall:${stall.id}`, (d) => ({
          ...d,
          stalls: d.stalls.map((s) => (s.id === stall.id ? stall : s)),
          translation: viChanged
            ? { ...d.translation, [`stall:${stall.id}`]: markOutdated(d.translation[`stall:${stall.id}`]) }
            : d.translation,
        })),
      addStall: (stall) =>
        edit(`stall:${stall.id}`, (d) => ({
          ...d,
          stalls: [...d.stalls, stall],
          translation: { ...d.translation, [`stall:${stall.id}`]: Object.fromEntries(TARGET_LANGS.map((l) => [l, 'missing'])) },
        })),
      removeStall: (id) => edit(`stall:${id}`, (d) => ({ ...d, stalls: d.stalls.filter((s) => s.id !== id) })),
      updateZone: (zone, viChanged) =>
        edit(`zone:${zone.id}`, (d) => ({
          ...d,
          zones: d.zones.map((z) => (z.id === zone.id ? zone : z)),
          translation: viChanged
            ? { ...d.translation, [`zone:${zone.id}`]: markOutdated(d.translation[`zone:${zone.id}`]) }
            : d.translation,
        })),
      updateShow: (show) => {
        mark(`show:${show.id}`);
        setData((d) => ({ ...d, shows: d.shows.map((s) => (s.id === show.id ? show : s)) }));
      },
      // Sửa trên dữ liệu mới nhất (d), để dịch liền nhiều ngôn ngữ của cùng một điểm không đè mất nhau.
      setPointTexts: (key, lang, changes, status) =>
        edit(key, (d) => {
          const [entity, id] = key.split(':');
          const apply = <T extends Zone | Stall>(item: T): T => {
            if (item.id !== id) return item;
            const next = { ...item } as Record<string, unknown>;
            for (const [field, text] of Object.entries(changes)) {
              next[field] = { ...((item as unknown as Record<string, Localized | undefined>)[field] ?? { vi: '' }), [lang]: text };
            }
            return next as unknown as T;
          };
          return {
            ...d,
            zones: entity === 'zone' ? d.zones.map(apply) : d.zones,
            stalls: entity === 'stall' ? d.stalls.map(apply) : d.stalls,
            translation: { ...d.translation, [key]: { ...d.translation[key], [lang]: status } },
          };
        }),
      setPublished: (key, published) =>
        edit(key, (d) => {
          const [entity, id] = key.split(':');
          return {
            ...d,
            zones: entity === 'zone' ? d.zones.map((z) => (z.id === id ? { ...z, published } : z)) : d.zones,
            stalls: entity === 'stall' ? d.stalls.map((s) => (s.id === id ? { ...s, published } : s)) : d.stalls,
          };
        }),
      setTranslation,
      setAnnouncement: (announcement) => {
        mark('announcement');
        setData((d) => ({ ...d, announcement }));
      },
      // Có database thì đọc lại từ database, không thì về dữ liệu mẫu.
      reset: () => (token ? void loadFromDb() : setData(seedData())),
    }),
    [data, sync, token, mark, edit, setTranslation, loadFromDb],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore phải được dùng bên trong StoreProvider');
  return ctx;
}
