import type { Lang } from '@mtll/shared';
import { api } from './api';

export interface TranslateResult {
  text: string;
  demo: boolean;
}

/**
 * UC13 Dịch tự động: gửi chữ tiếng Việt cho API, API áp bảng thuật ngữ rồi nhờ MyMemory dịch (xem apps/api/src/mymemory.js).
 *
 * Không có API (chế độ demo, chưa đăng nhập bằng SQL Server) thì trả về bản dịch mẫu để vẫn bấm thử được.
 */
export async function translateText(text: string, target: Exclude<Lang, 'vi'>, token: string | null): Promise<TranslateResult> {
  if (!text.trim()) return { text: '', demo: !token };
  if (!token) return { text: demoTranslate(text, target), demo: true };
  const res = await api<{ text: string }>('/translate', { method: 'POST', token, body: { text, target } });
  return { text: res.text, demo: false };
}

/** Bản dịch giả cho chế độ demo: gắn nhãn ngôn ngữ để người duyệt biết cần sửa. */
export function demoTranslate(text: string, target: Exclude<Lang, 'vi'>): string {
  return `[${target.toUpperCase()} bản nháp] ${text}`;
}
