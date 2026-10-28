import type { Lang, Localized, MapRect, Show, ShowSlot, Stall, StallKind, Zone, ZoneKind } from './types';

/**
 * Chuyển dữ liệu lễ hội qua lại giữa kiểu trong code và các dòng của các bảng trên SQL Server
 * (xem database/MuaThuLongLay.sql). API trả về đúng dạng ContentRows.
 * Chỉ là hàm thuần, không gọi mạng, nên app và web dùng chung và test được.
 */

export type Entity = 'zone' | 'stall' | 'show';
/** Trạng thái một bản dịch trong bảng translations. "missing" nghĩa là chưa có dòng nào. */
export type DbStatus = 'draft' | 'approved' | 'outdated';
export type TranslationState = DbStatus | 'missing';
/** Trạng thái dịch theo khoá "stall:F1" hoặc "zone:A", rồi theo ngôn ngữ. */
export type StatusMap = Record<string, Partial<Record<Lang, TranslationState>>>;

export interface ZoneRow {
  id: string;
  kind: ZoneKind;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  map_rect: number[]; // API ghép từ 4 cột map_x, map_y, map_w, map_h
}

export interface StallRow {
  id: string;
  zone_id: string;
  kind: StallKind;
  map_x: number;
  map_y: number;
  suggested: boolean;
}

export interface ShowRow {
  id: string;
  slot: ShowSlot;
  starts_at: string;
  ends_at: string;
}

export interface TranslationRow {
  entity: Entity;
  entity_id: string;
  field: string;
  lang: Lang;
  text: string;
  status: DbStatus;
}

export interface Content {
  zones: Zone[];
  stalls: Stall[];
  shows: Show[];
}

export interface ContentRows {
  zones: ZoneRow[];
  stalls: StallRow[];
  shows: ShowRow[];
  translations: TranslationRow[];
}

/** Các trường có chữ cần dịch của từng loại nội dung. */
export const ENTITY_FIELDS = {
  zone: ['name', 'label', 'narration'],
  stall: ['name', 'description', 'price', 'allergens'],
  show: ['name', 'description'],
} as const satisfies Record<Entity, readonly string[]>;

export const entityKey = (entity: Entity, id: string) => `${entity}:${id}`;

export function zoneToRow(z: Zone): ZoneRow {
  return { id: z.id, kind: z.kind, center_lat: z.center.lat, center_lng: z.center.lng, radius_m: z.radiusM, map_rect: [...z.mapRect] };
}

export function stallToRow(s: Stall): StallRow {
  return { id: s.id, zone_id: s.zoneId, kind: s.kind, map_x: s.mapPos[0], map_y: s.mapPos[1], suggested: s.suggested ?? false };
}

export function showToRow(s: Show): ShowRow {
  return { id: s.id, slot: s.slot, starts_at: s.start, ends_at: s.end };
}

/**
 * Các dòng dịch của một nội dung. Bản tiếng Việt luôn "approved"; bản khác lấy trạng thái trong `statuses`
 * (mặc định "approved"), bỏ qua bản rỗng hoặc đang "missing".
 */
export function translationRows(
  entity: Entity,
  item: Record<string, unknown> & { id: string },
  statuses: Partial<Record<Lang, TranslationState>> = {},
): TranslationRow[] {
  const rows: TranslationRow[] = [];
  for (const field of ENTITY_FIELDS[entity]) {
    const value = item[field] as Localized | undefined;
    if (!value) continue;
    for (const [lang, text] of Object.entries(value) as [Lang, string | undefined][]) {
      if (!text?.trim()) continue;
      const status = lang === 'vi' ? 'approved' : (statuses[lang] ?? 'approved');
      if (status === 'missing') continue;
      rows.push({ entity, entity_id: item.id, field, lang, text, status });
    }
  }
  return rows;
}

export function contentToRows(content: Content, statuses: StatusMap = {}): ContentRows {
  const tr = (entity: Entity, items: (Zone | Stall | Show)[]) =>
    items.flatMap((it) =>
      translationRows(entity, it as unknown as Record<string, unknown> & { id: string }, statuses[entityKey(entity, it.id)]),
    );
  return {
    zones: content.zones.map(zoneToRow),
    stalls: content.stalls.map(stallToRow),
    shows: content.shows.map(showToRow),
    translations: [...tr('zone', content.zones), ...tr('stall', content.stalls), ...tr('show', content.shows)],
  };
}

const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id, 'en', { numeric: true });
const RANK: Record<DbStatus, number> = { approved: 0, draft: 1, outdated: 2 };

/** Ghép các dòng đọc từ database thành dữ liệu lễ hội, kèm trạng thái dịch của từng nội dung. */
export function rowsToContent(rows: ContentRows): Content & { statuses: StatusMap } {
  const text = new Map<string, Localized>();
  const statuses: StatusMap = {};
  for (const r of rows.translations) {
    const key = `${r.entity}:${r.entity_id}:${r.field}`;
    text.set(key, { ...(text.get(key) ?? { vi: '' }), [r.lang]: r.text });
    if (r.lang === 'vi') continue;
    const ek = entityKey(r.entity, r.entity_id);
    const prev = statuses[ek]?.[r.lang];
    // Một nội dung có nhiều trường: lấy trạng thái "tệ" nhất để không duyệt sót trường nào.
    if (!prev || prev === 'missing' || RANK[r.status] > RANK[prev]) statuses[ek] = { ...statuses[ek], [r.lang]: r.status };
  }
  const loc = (entity: Entity, id: string, field: string): Localized => text.get(`${entity}:${id}:${field}`) ?? { vi: '' };

  const zones: Zone[] = [...rows.zones].sort(byId).map((z) => ({
    id: z.id,
    kind: z.kind,
    name: loc('zone', z.id, 'name'),
    label: loc('zone', z.id, 'label'),
    narration: loc('zone', z.id, 'narration'),
    center: { lat: z.center_lat, lng: z.center_lng },
    radiusM: z.radius_m,
    mapRect: z.map_rect.slice(0, 4) as MapRect,
  }));
  const stalls: Stall[] = [...rows.stalls].sort(byId).map((s) => {
    const allergens = text.get(`stall:${s.id}:allergens`);
    return {
      id: s.id,
      zoneId: s.zone_id,
      kind: s.kind,
      name: loc('stall', s.id, 'name'),
      description: loc('stall', s.id, 'description'),
      price: loc('stall', s.id, 'price'),
      ...(allergens ? { allergens } : {}),
      mapPos: [s.map_x, s.map_y],
      ...(s.suggested ? { suggested: true } : {}),
    };
  });
  const shows: Show[] = [...rows.shows]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map((s) => ({
      id: s.id,
      slot: s.slot,
      // Postgres trả kiểu time dạng "19:30:00", app dùng "19:30".
      start: s.starts_at.slice(0, 5),
      end: s.ends_at.slice(0, 5),
      name: loc('show', s.id, 'name'),
      description: loc('show', s.id, 'description'),
    }));
  return { zones, stalls, shows, statuses };
}
