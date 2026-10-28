import type { Lang } from '@mtll/shared';

/**
 * Địa chỉ dịch vụ dịch máy (tuỳ chọn), đặt trong file .env: VITE_TRANSLATE_URL=https://...
 * Dịch vụ đó nhận { text, source, target } và trả về { translatedText }. Bỏ trống thì dùng bản dịch mẫu.
 */
const TRANSLATE_URL: string | undefined = import.meta.env.VITE_TRANSLATE_URL;

export const isDemoTranslator = !TRANSLATE_URL;

export interface TranslateResult {
  text: string;
  demo: boolean;
}

/**
 * UC13 Dịch tự động: gửi chữ tiếng Việt tới dịch vụ dịch máy (nếu có), không có thì dùng bản dịch mẫu.
 *
 * Dịch một đoạn tiếng Việt sang ngôn ngữ đích. Chưa cấu hình dịch vụ thì trả về bản dịch mẫu để demo.
 */
export async function translateText(text: string, target: Exclude<Lang, 'vi'>): Promise<TranslateResult> {
  if (!text.trim()) return { text: '', demo: isDemoTranslator };
  if (!TRANSLATE_URL) return { text: demoTranslate(text, target), demo: true };

  const res = await fetch(TRANSLATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source: 'vi', target }),
  });
  if (!res.ok) throw new Error(`Dịch vụ dịch trả lỗi ${res.status}. Thử lại sau hoặc nhập bản dịch bằng tay.`);
  const body = (await res.json()) as { translatedText?: string };
  if (!body.translatedText) throw new Error('Dịch vụ dịch không trả về nội dung.');
  return { text: body.translatedText, demo: false };
}

/** Bản dịch giả cho chế độ demo: gắn nhãn ngôn ngữ để người duyệt biết cần sửa. */
export function demoTranslate(text: string, target: Exclude<Lang, 'vi'>): string {
  return `[${target.toUpperCase()} bản nháp] ${text}`;
}
