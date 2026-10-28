import type { ContentRows } from '@mtll/shared';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface Announcement {
  id: number;
  text_vi: string;
  active: boolean;
}

export type ContentResponse = ContentRows & { announcement: Announcement | null };

/** Lấy nội dung lễ hội từ SQL Server qua API. Trả về null khi không có API (ví dụ bản trên GitHub Pages). */
export async function fetchContent(): Promise<ContentResponse | null> {
  try {
    const res = await fetch(`${BASE}/api/content`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
    return (await res.json()) as ContentResponse;
  } catch {
    return null;
  }
}

export type VisitType = 'scan' | 'play' | 'zone_enter';

/**
 * UC03, UC04: ghi một lượt quét QR / bấm nghe / đi vào khu vào bảng visit_events.
 * Lỗi mạng thì bỏ qua, không làm phiền khách.
 */
export function logVisit(type: VisitType, where: { stallId?: string; zoneId?: string }, lang: string) {
  const body = JSON.stringify({ type, lang, deviceId: deviceId(), stallId: where.stallId ?? null, zoneId: where.zoneId ?? null });
  fetch(`${BASE}/api/visits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(
    () => undefined,
  );
}

/**
 * UC10 (phía khách): báo cho máy chủ biết trang khách đang mở, để trang Tổng quan đếm số người đang truy cập.
 * Gửi ngay khi mở trang, rồi cứ 20 giây gửi lại một lần. Khi khách đóng trang thì báo rời đi.
 * Trả về hàm dừng lại (dùng trong useEffect).
 */
export function startPresence(getLang: () => string): () => void {
  const ping = () => {
    if (document.visibilityState !== 'visible') return;
    const body = JSON.stringify({ lang: getLang(), deviceId: deviceId() });
    fetch(`${BASE}/api/presence`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => undefined);
  };
  const leave = () => {
    const body = new Blob([JSON.stringify({ deviceId: deviceId() })], { type: 'application/json' });
    navigator.sendBeacon?.(`${BASE}/api/presence/leave`, body);
  };
  ping();
  const timer = setInterval(ping, 20_000);
  document.addEventListener('visibilitychange', ping);
  window.addEventListener('pagehide', leave);
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', ping);
    window.removeEventListener('pagehide', leave);
  };
}

const DEVICE_KEY = 'mtll-device-id';

/** Mã ngẫu nhiên của trình duyệt này, để đếm số khách mà không cần biết khách là ai. */
function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}
