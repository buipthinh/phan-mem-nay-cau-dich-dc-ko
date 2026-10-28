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
});
