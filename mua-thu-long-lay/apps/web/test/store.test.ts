import { describe, expect, it } from 'vitest';
import { festival } from '@mtll/shared';
import { approvedCount, formatTime, isPublished, pointFields, translatePoint } from '../src/lib/points';
import { listPoints, markOutdated, seedData } from '../src/lib/store';
import { demoTranslate, translateText } from '../src/lib/translator';
import { sampleStats } from '../src/lib/stats';

describe('dữ liệu quản trị', () => {
  it('dữ liệu mẫu có đủ gian hàng và tiếng Trung chưa dịch', () => {
    const d = seedData();
    expect(d.stalls).toHaveLength(festival.stalls.length);
    expect(d.translation['stall:F1'].en).toBe('approved');
    expect(d.translation['stall:F1'].zh).toBe('missing');
  });

  it('sửa bản gốc thì bản dịch đã có chuyển sang cần dịch lại, bản chưa dịch giữ nguyên', () => {
    expect(markOutdated({ en: 'approved', zh: 'draft', ko: 'missing' })).toEqual({ en: 'outdated', zh: 'outdated', ko: 'missing' });
  });
});

describe('dịch tự động ở chế độ demo', () => {
  it('trả về bản nháp có gắn nhãn ngôn ngữ', async () => {
    const r = await translateText('Cốm làng Vòng', 'en', null);
    expect(r.demo).toBe(true);
    expect(r.text).toBe(demoTranslate('Cốm làng Vòng', 'en'));
  });

  it('chuỗi rỗng thì không dịch', async () => {
    expect((await translateText('   ', 'ko', null)).text).toBe('');
  });
});

describe('điểm thuyết minh', () => {
  it('gộp khu và gian hàng thành một danh sách, khu đứng trước', () => {
    const d = seedData();
    const points = listPoints(d);
    expect(points).toHaveLength(d.zones.length + d.stalls.length);
    expect(points[0].type).toBe('zone');
    expect(points.at(-1)?.type).toBe('stall');
    expect(isPublished(points[0])).toBe(true);
    expect(isPublished({ ...points[0], item: { ...d.zones[0], published: false } } as (typeof points)[number])).toBe(false);
  });

  it('đếm số ngôn ngữ đã duyệt', () => {
    const d = seedData();
    expect(approvedCount(d, 'stall:F1')).toBe(Object.values(d.translation['stall:F1']).filter((s) => s === 'approved').length);
    expect(approvedCount(d, 'stall:KHONG_CO')).toBe(0);
  });

  it('khu dịch tên và thuyết minh, gian dịch tên, mô tả, giá', async () => {
    const [zone] = listPoints(seedData());
    expect(pointFields(zone).map((f) => f.key)).toEqual(['name', 'narration']);
    const out = await translatePoint(zone, 'ja', null);
    expect(out.name).toBe(demoTranslate(zone.item.name.vi, 'ja'));
  });

  it('ngày giờ hiện kiểu Việt Nam', () => {
    expect(formatTime(new Date(2026, 9, 29, 8, 5).toISOString())).toBe('29/10/2026 08:05');
    expect(formatTime(undefined)).toBe('—');
  });
});

describe('số liệu mẫu', () => {
  it('ổn định giữa các lần chạy và tổng theo giờ khớp tổng lượt quét', () => {
    const a = sampleStats(festival.stalls);
    const b = sampleStats(festival.stalls);
    expect(a.totalScans).toBe(b.totalScans);
    const hourly = a.byHour.reduce((n, h) => n + h.scans, 0);
    expect(Math.abs(hourly - a.totalScans)).toBeLessThan(a.byHour.length);
    expect(a.byLang.reduce((n, l) => n + l.share, 0)).toBeCloseTo(1);
  });
});
