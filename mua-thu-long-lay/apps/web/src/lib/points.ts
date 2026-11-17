import { useEffect } from 'react';
import { LANGS, type Lang, type Stall, type Zone } from '@mtll/shared';
import type { TranslatableField } from '../components/TranslationPanel';
import type { AdminData, Point, TranslationStatus } from './store';
import { translateText } from './translator';

export type Target = Exclude<Lang, 'vi'>;

/** Ngôn ngữ cần dịch (mọi ngôn ngữ trừ tiếng Việt gốc). */
export const TARGETS = LANGS.filter((l): l is (typeof LANGS)[number] & { code: Target } => l.code !== 'vi');

export const STATUS_LABEL: Record<TranslationStatus, string> = {
  missing: 'Chưa dịch',
  draft: 'Chờ duyệt',
  approved: 'Đã duyệt',
  outdated: 'Cần cập nhật',
};

const ZONE_KIND: Record<Zone['kind'], string> = {
  food: 'Khu ẩm thực',
  game: 'Khu trò chơi',
  craft: 'Khu thủ công',
  stage: 'Sân khấu',
  plaza: 'Quảng trường',
};
const STALL_KIND: Record<Stall['kind'], string> = { food: 'Gian ẩm thực', game: 'Gian trò chơi', craft: 'Gian thủ công' };

/** Loại điểm, dùng cho bộ lọc "Tất cả loại". */
export type PointType = 'zone' | 'food' | 'game' | 'craft';
export const POINT_TYPES: [PointType, string][] = [
  ['zone', 'Khu (thuyết minh theo GPS)'],
  ['food', 'Gian ẩm thực'],
  ['game', 'Gian trò chơi'],
  ['craft', 'Gian thủ công'],
];

export const pointType = (p: Point): PointType => (p.type === 'zone' ? 'zone' : p.item.kind);
export const kindLabel = (p: Point) => (p.type === 'zone' ? ZONE_KIND[p.item.kind] : STALL_KIND[p.item.kind]);

/** Dòng chữ nhỏ dưới tên điểm. */
export function pointSubtitle(p: Point, data: AdminData) {
  if (p.type === 'zone') return `Khu ${p.item.id} · bán kính ${p.item.radiusM} m`;
  const zone = data.zones.find((z) => z.id === p.item.zoneId);
  return `Mã ${p.item.id} · ${zone ? `Khu ${zone.id} ${zone.name.vi}` : 'chưa có khu'}`;
}

export const pointEditUrl = (p: Point) => (p.type === 'zone' ? `/points/zone/${p.item.id}` : `/stalls/${p.item.id}`);
export const isPublished = (p: Point) => p.item.published !== false;

/** Các trường chữ cần dịch của một điểm. */
export function pointFields(p: Point): TranslatableField[] {
  if (p.type === 'zone') {
    return [
      { key: 'name', label: 'Tên khu', value: p.item.name },
      { key: 'narration', label: 'Thuyết minh', value: p.item.narration, multiline: true },
    ];
  }
  const s = p.item;
  return [
    { key: 'name', label: 'Tên', value: s.name },
    { key: 'description', label: 'Mô tả', value: s.description, multiline: true },
    { key: 'price', label: 'Giá', value: s.price },
    ...(s.allergens?.vi ? [{ key: 'allergens', label: 'Dị ứng', value: s.allergens }] : []),
  ];
}

/** Số ngôn ngữ đã duyệt của một điểm. */
export function approvedCount(data: AdminData, key: string) {
  const st = data.translation[key] ?? {};
  return TARGETS.filter((t) => st[t.code] === 'approved').length;
}

/** Ngày giờ kiểu Việt Nam: 29/10/2026 14:05. */
export function formatTime(iso: string | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Dịch máy mọi trường của một điểm sang một ngôn ngữ. Trả về các chữ đã dịch, theo tên trường. */
export async function translatePoint(p: Point, lang: Target, token: string | null) {
  const changes: Record<string, string> = {};
  for (const f of pointFields(p)) changes[f.key] = (await translateText(f.value.vi, lang, token)).text;
  return changes;
}

/** Trang sửa điểm mở với ?lang=ko (bấm từ trang Duyệt bản dịch): cuộn xuống khung bản dịch và mở sẵn ngôn ngữ đó. */
export function useScrollToTranslation(params: URLSearchParams): Target | undefined {
  const raw = params.get('lang');
  const lang = TARGETS.some((t) => t.code === raw) ? (raw as Target) : undefined;
  useEffect(() => {
    if (lang) document.getElementById('ban-dich')?.scrollIntoView({ block: 'start' });
  }, [lang]);
  return lang;
}
