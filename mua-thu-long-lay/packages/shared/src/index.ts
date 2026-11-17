export * from './types';
export * from './i18n';
export * from './messages';
export * from './geo';
export * from './qr';
export * from './schedule';
export * from './stamps';
export * from './db';
export { festival } from './data/festival';

import { festival } from './data/festival';
import type { Stall, Zone } from './types';

export function getStall(id: string): Stall | undefined {
  return festival.stalls.find((s) => s.id === id);
}

export function getZone(id: string): Zone | undefined {
  return festival.zones.find((z) => z.id === id);
}

/** Màu cố định của từng loại khu, dùng chung cho bản đồ trên web và mobile. */
export const ZONE_COLORS: Record<Zone['kind'], string> = {
  food: '#C97A06',
  game: '#2A8576',
  craft: '#8A4F9E',
  stage: '#B23A48',
  plaza: '#6F7D95',
};
