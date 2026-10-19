import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { festival, type Lang, type Localized, type Show, type Stall, type Zone } from '@mtll/shared';

/** Trạng thái bản dịch của một nội dung ở một ngôn ngữ. */
export type TranslationStatus = 'missing' | 'draft' | 'approved' | 'outdated';

export interface AdminData {
  zones: Zone[];
  stalls: Stall[];
  shows: Show[];
  /** Trạng thái dịch theo khoá "stall:F1" hoặc "zone:A", rồi theo ngôn ngữ. */
  translation: Record<string, Partial<Record<Lang, TranslationStatus>>>;
  /** Thông báo khẩn hiện trên đầu app khách (vd. phương án trời mưa). */
  announcement: { text: string; active: boolean };
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
    announcement: {
      text: 'Trời đang mưa: các suất diễn chuyển vào nhà bạt cạnh Quảng trường Lá Phong.',
      active: false,
    },
  };
}

/**
 * Lưu tạm trên trình duyệt (localStorage) để demo chạy không cần backend.
 * Khi nối Supabase, chỉ cần thay hai hàm load/save này bằng truy vấn tới các bảng.
 */
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

interface StoreValue {
  data: AdminData;
  updateStall: (stall: Stall, viChanged: boolean) => void;
  addStall: (stall: Stall) => void;
  removeStall: (id: string) => void;
  updateZone: (zone: Zone, viChanged: boolean) => void;
  updateShow: (show: Show) => void;
  setTranslation: (key: string, lang: Lang, status: TranslationStatus) => void;
  setAnnouncement: (a: AdminData['announcement']) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminData>(load);
  useEffect(() => save(data), [data]);

  const setTranslation = useCallback((key: string, lang: Lang, status: TranslationStatus) => {
    setData((d) => ({ ...d, translation: { ...d.translation, [key]: { ...d.translation[key], [lang]: status } } }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      updateStall: (stall, viChanged) =>
        setData((d) => ({
          ...d,
          stalls: d.stalls.map((s) => (s.id === stall.id ? stall : s)),
          translation: viChanged
            ? { ...d.translation, [`stall:${stall.id}`]: markOutdated(d.translation[`stall:${stall.id}`]) }
            : d.translation,
        })),
      addStall: (stall) =>
        setData((d) => ({
          ...d,
          stalls: [...d.stalls, stall],
          translation: { ...d.translation, [`stall:${stall.id}`]: { en: 'missing', zh: 'missing', ko: 'missing' } },
        })),
      removeStall: (id) => setData((d) => ({ ...d, stalls: d.stalls.filter((s) => s.id !== id) })),
      updateZone: (zone, viChanged) =>
        setData((d) => ({
          ...d,
          zones: d.zones.map((z) => (z.id === zone.id ? zone : z)),
          translation: viChanged
            ? { ...d.translation, [`zone:${zone.id}`]: markOutdated(d.translation[`zone:${zone.id}`]) }
            : d.translation,
        })),
      updateShow: (show) => setData((d) => ({ ...d, shows: d.shows.map((s) => (s.id === show.id ? show : s)) })),
      setTranslation,
      setAnnouncement: (announcement) => setData((d) => ({ ...d, announcement })),
      reset: () => setData(seedData()),
    }),
    [data, setTranslation],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore phải được dùng bên trong StoreProvider');
  return ctx;
}
