import type { Lang, Stall } from '@mtll/shared';

export interface VisitStats {
  byStall: { stall: Stall; scans: number; plays: number }[];
  byLang: { lang: Lang; share: number }[];
  byHour: { hour: number; scans: number }[];
  totalScans: number;
  totalPlays: number;
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
 * Số liệu mẫu cho trang Tổng quan. Bản thật đếm từ bảng visit_events trên Supabase
 * (mỗi lần khách quét QR hoặc nghe thuyết minh, app ghi một dòng).
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
  };
}
