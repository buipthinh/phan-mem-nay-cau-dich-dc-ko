import type { Lang, Stall } from '@mtll/shared';

export interface VisitStats {
  byStall: { stall: Stall; scans: number; plays: number }[];
  byLang: { lang: Lang; share: number }[];
  byHour: { hour: number; scans: number }[];
  totalScans: number;
  totalPlays: number;
  /** Số máy đang mở web khách lúc này. null khi chạy demo không có database. */
  online: number | null;
  /** Số người truy cập theo từng ngày, khoá là ngày dạng YYYY-MM-DD. */
  visitorsByDay: Record<string, number>;
}

/** Bộ sinh số giả lập có hạt giống cố định, để số liệu demo giống nhau mỗi lần mở. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * UC10 Tổng quan thống kê.
 * Số liệu mẫu cho trang Tổng quan. Bản thật đếm từ bảng visit_events trên SQL Server (GET /api/stats)
 * (mỗi lần khách quét QR hoặc nghe thuyết minh, trang khách ghi một dòng).
 */
export function sampleStats(stalls: Stall[]): VisitStats {
  const rand = seeded(2026);
  const byStall = stalls
    .map((stall) => {
      const base = stall.kind === 'food' ? 260 : stall.kind === 'game' ? 170 : 120;
      const scans = Math.round(base * (0.55 + rand()));
      return { stall, scans, plays: Math.round(scans * (0.6 + rand() * 0.3)) };
    })
    .sort((a, b) => b.scans - a.scans);
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const curve = [0.3, 0.6, 0.7, 0.75, 0.9, 0.7, 0.55, 0.6, 0.85, 0.8, 0.9, 1, 0.95, 0.6];
  const totalScans = byStall.reduce((n, s) => n + s.scans, 0);
  const weight = curve.reduce((a, b) => a + b, 0);
  return {
    byStall,
    byLang: [
      { lang: 'vi', share: 0.42 },
      { lang: 'en', share: 0.26 },
      { lang: 'ko', share: 0.11 },
      { lang: 'zh', share: 0.09 },
      { lang: 'ja', share: 0.07 },
      { lang: 'de', share: 0.05 },
    ],
    byHour: hours.map((hour, i) => ({ hour, scans: Math.round((totalScans * curve[i]) / weight) })),
    totalScans,
    totalPlays: byStall.reduce((n, s) => n + s.plays, 0),
    online: null,
    visitorsByDay: {},
  };
}

/** Số liệu trả về từ GET /api/stats (đếm trong bảng visit_events). */
export interface ApiStats {
  byStall: { stall_id: string; scans: number; plays: number }[];
  byLang: { lang: Lang; share: number }[];
  byHour: { hour: number; scans: number }[];
  totalScans: number;
  totalPlays: number;
  online: number;
  visitorsByDay: { day: string; visitors: number }[];
}

/** Đổi số liệu thật từ SQL Server sang dạng trang Tổng quan vẽ, điền 0 cho các giờ chưa có lượt quét. */
export function statsFromApi(res: ApiStats, stalls: Stall[], openHour: number, closeHour: number): VisitStats {
  const byStall = res.byStall.flatMap((r) => {
    const stall = stalls.find((s) => s.id === r.stall_id);
    return stall ? [{ stall, scans: r.scans, plays: r.plays }] : [];
  });
  const hours = res.byHour.map((h) => h.hour);
  const from = Math.min(openHour, ...hours);
  const to = Math.max(closeHour - 1, ...hours);
  const byHour = Array.from({ length: to - from + 1 }, (_, i) => ({
    hour: from + i,
    scans: res.byHour.find((h) => h.hour === from + i)?.scans ?? 0,
  }));
  return {
    byStall,
    byLang: res.byLang,
    byHour,
    totalScans: res.totalScans,
    totalPlays: res.totalPlays,
    online: res.online,
    visitorsByDay: Object.fromEntries(res.visitorsByDay.map((d) => [d.day, d.visitors])),
  };
}
