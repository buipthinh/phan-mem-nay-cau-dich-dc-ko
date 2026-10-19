import type { Lang, Localized } from './types';

export const LANGS: { code: Lang; label: string; speech: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', speech: 'vi-VN' },
  { code: 'en', label: 'English', speech: 'en-US' },
  { code: 'zh', label: '中文', speech: 'zh-CN' },
  { code: 'ko', label: '한국어', speech: 'ko-KR' },
  { code: 'ja', label: '日本語', speech: 'ja-JP' },
  { code: 'de', label: 'Deutsch', speech: 'de-DE' },
];

export const DEFAULT_LANG: Lang = 'vi';

export function isLang(value: unknown): value is Lang {
  return LANGS.some((l) => l.code === value);
}

/**
 * Chọn ngôn ngữ ban đầu từ danh sách ngôn ngữ của máy (vd. ["ko-KR", "en-US"]).
 * Lấy ngôn ngữ đầu tiên mà hệ thống hỗ trợ, nếu không có thì dùng tiếng Anh.
 */
export function pickLang(deviceLocales: readonly string[]): Lang {
  for (const tag of deviceLocales) {
    const code = tag.toLowerCase().split(/[-_]/)[0];
    if (isLang(code)) return code;
  }
  return 'en';
}

/** Ngôn ngữ dùng thay khi chưa có bản dịch: thử tiếng Anh, cuối cùng là tiếng Việt gốc. */
const FALLBACK: Record<Lang, Lang[]> = {
  vi: ['vi'],
  en: ['en', 'vi'],
  zh: ['zh', 'en', 'vi'],
  ko: ['ko', 'en', 'vi'],
  ja: ['ja', 'en', 'vi'],
  de: ['de', 'en', 'vi'],
};

export interface Resolved {
  text: string;
  /** Ngôn ngữ thực sự được dùng, khác `lang` khi phải dùng bản thay thế. */
  lang: Lang;
  isFallback: boolean;
}

export function resolveText(value: Localized, lang: Lang): Resolved {
  for (const l of FALLBACK[lang]) {
    const text = value[l];
    if (text && text.trim()) return { text, lang: l, isFallback: l !== lang };
  }
  return { text: value.vi, lang: 'vi', isFallback: lang !== 'vi' };
}

/** Lấy chữ theo ngôn ngữ, tự dùng bản thay thế khi thiếu bản dịch. */
export function tr(value: Localized, lang: Lang): string {
  return resolveText(value, lang).text;
}

export function speechLocale(lang: Lang): string {
  return LANGS.find((l) => l.code === lang)?.speech ?? 'vi-VN';
}
