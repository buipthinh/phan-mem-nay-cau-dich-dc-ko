import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addStamp, isLang, translate, tr, type Lang, type Localized, type MessageKey } from '@mtll/shared';

const KEY = 'mtll-settings-v1';

interface Persisted {
  lang: Lang | null;
  autoNarrate: boolean;
  rate: number;
  stamps: string[];
  /** Mã notification đã đặt theo từng suất diễn, để huỷ khi khách tắt nhắc. */
  reminders: Record<string, string[]>;
  history: string[];
}

const DEFAULTS: Persisted = { lang: null, autoNarrate: true, rate: 1, stamps: [], reminders: {}, history: [] };

interface SettingsValue extends Persisted {
  ready: boolean;
  setLang: (lang: Lang) => void;
  setAutoNarrate: (on: boolean) => void;
  setRate: (rate: number) => void;
  /** Ghi tem cho một gian hàng. Trả về true nếu là tem mới. */
  collectStamp: (stallId: string) => boolean;
  clearStamps: () => void;
  setReminder: (showId: string, ids: string[] | null) => void;
  pushHistory: (stallId: string) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  tl: (value: Localized) => string;
}

const SettingsContext = createContext<SettingsValue | null>(null);

/** Cài đặt và dữ liệu cá nhân của khách, lưu trên máy bằng AsyncStorage (dùng được khi mất mạng). */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Persisted>;
        setState({ ...DEFAULTS, ...saved, lang: isLang(saved.lang) ? saved.lang : null });
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, ready]);

  const collectStamp = useCallback(
    (stallId: string) => {
      const { added } = addStamp(state.stamps, stallId);
      if (added) setState((s) => ({ ...s, stamps: addStamp(s.stamps, stallId).card }));
      return added;
    },
    [state.stamps],
  );

  const value = useMemo<SettingsValue>(() => {
    const lang = state.lang ?? 'vi';
    return {
      ...state,
      ready,
      setLang: (l) => setState((s) => ({ ...s, lang: l })),
      setAutoNarrate: (on) => setState((s) => ({ ...s, autoNarrate: on })),
      setRate: (rate) => setState((s) => ({ ...s, rate })),
      collectStamp,
      clearStamps: () => setState((s) => ({ ...s, stamps: [] })),
      setReminder: (showId, ids) =>
        setState((s) => {
          const reminders = { ...s.reminders };
          if (ids) reminders[showId] = ids;
          else delete reminders[showId];
          return { ...s, reminders };
        }),
      pushHistory: (stallId) => setState((s) => ({ ...s, history: [stallId, ...s.history.filter((h) => h !== stallId)].slice(0, 30) })),
      t: (key, vars) => translate(lang, key, vars),
      tl: (v) => tr(v, lang),
    };
  }, [state, ready, collectStamp]);

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
