import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addStamp, isLang, translate, tr, type Lang, type Localized, type MessageKey } from '@mtll/shared';

const KEY = 'mtll-guest-v1';

interface Persisted {
  lang: Lang | null;
  autoNarrate: boolean;
  rate: number;
  stamps: string[];
}

const DEFAULTS: Persisted = { lang: null, autoNarrate: true, rate: 1, stamps: [] };

interface SettingsValue extends Persisted {
  setLang: (lang: Lang) => void;
  setAutoNarrate: (on: boolean) => void;
  setRate: (rate: number) => void;
  /** Ghi tem cho một gian hàng. Trả về true nếu là tem mới. */
  collectStamp: (stallId: string) => boolean;
  clearStamps: () => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  tl: (value: Localized) => string;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function load(): Persisted {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Persisted>;
    return { ...DEFAULTS, ...saved, lang: isLang(saved.lang) ? saved.lang : null };
  } catch {
    return DEFAULTS;
  }
}

/**
 * UC01, UC07, UC08: lưu ngôn ngữ, thẻ tem và cài đặt đọc của khách.
 *
 * Cài đặt và thẻ tem của khách, lưu ngay trong trình duyệt của khách (localStorage), không cần tài khoản.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  // Bản mới nhất của thẻ tem, để collectStamp trả kết quả đúng ngay cả khi gọi 2 lần liền nhau.
  const stampsRef = useRef(state.stamps);

  useEffect(() => {
    stampsRef.current = state.stamps;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Trình duyệt chặn lưu (chế độ ẩn danh): vẫn dùng được, chỉ không nhớ khi tải lại trang.
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.lang = state.lang ?? 'vi';
  }, [state.lang]);

  const value = useMemo<SettingsValue>(() => {
    const lang = state.lang ?? 'vi';
    return {
      ...state,
      setLang: (l) => setState((s) => ({ ...s, lang: l })),
      setAutoNarrate: (on) => setState((s) => ({ ...s, autoNarrate: on })),
      setRate: (rate) => setState((s) => ({ ...s, rate })),
      collectStamp: (stallId) => {
        const { card, added } = addStamp(stampsRef.current, stallId);
        if (added) {
          stampsRef.current = card;
          setState((s) => ({ ...s, stamps: card }));
        }
        return added;
      },
      clearStamps: () => setState((s) => ({ ...s, stamps: [] })),
      t: (key, vars) => translate(lang, key, vars),
      tl: (v) => tr(v, lang),
    };
  }, [state]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings phải được dùng bên trong SettingsProvider');
  return ctx;
}

/** Ngôn ngữ đang dùng (mặc định tiếng Việt khi chưa chọn). */
export function useLang(): Lang {
  return useSettings().lang ?? 'vi';
}
