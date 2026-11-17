import { describe, expect, it } from 'vitest';
import { contentToRows, festival, rowsToContent } from '../src';

describe('db mapping', () => {
  it('đổi dữ liệu lễ hội sang dòng database rồi ghép lại vẫn y như cũ', () => {
    const back = rowsToContent(contentToRows(festival));
    expect(back.zones).toEqual(festival.zones);
    expect(back.stalls).toEqual(festival.stalls);
    expect(back.shows.map((s) => s.id).sort()).toEqual(festival.shows.map((s) => s.id).sort());
    expect(back.shows.find((s) => s.id === festival.shows[0].id)).toEqual(festival.shows[0]);
  });

  it('lấy trạng thái dịch tệ nhất trong các trường, và bỏ bản đang thiếu', () => {
    const stall = festival.stalls[0];
    const rows = contentToRows({ zones: [], stalls: [stall], shows: [] }, { [`stall:${stall.id}`]: { en: 'draft', zh: 'missing' } });
    expect(rows.translations.some((t) => t.lang === 'zh')).toBe(false);
    rows.translations.find((t) => t.lang === 'en' && t.field === 'price')!.status = 'outdated';
    const { statuses } = rowsToContent({ ...rows, zones: contentToRows(festival).zones });
    expect(statuses[`stall:${stall.id}`]).toMatchObject({ en: 'outdated', ko: 'approved' });
    expect(statuses[`stall:${stall.id}`]?.zh).toBeUndefined();
  });

  it('điểm bị ẩn giữ published = false, và lấy giờ sửa mới nhất của mỗi điểm', () => {
    const rows = contentToRows(festival);
    rows.stalls[0].published = false;
    const id = rows.stalls[0].id;
    const tr = rows.translations.filter((t) => t.entity === 'stall' && t.entity_id === id);
    tr[0].updated_at = '2026-10-01T08:00:00';
    tr[1].updated_at = '2026-10-29T09:30:00';
    const back = rowsToContent(rows);
    expect(back.stalls[0].published).toBe(false);
    expect(back.stalls[1].published).toBeUndefined();
    expect(back.updated[`stall:${id}`]).toBe('2026-10-29T09:30:00');
  });
});
