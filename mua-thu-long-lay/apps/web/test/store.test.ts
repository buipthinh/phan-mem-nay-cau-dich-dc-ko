import { describe, expect, it } from 'vitest';
import { festival } from '@mtll/shared';
import { markOutdated, seedData } from '../src/lib/store';
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
    const r = await translateText('Cốm làng Vòng', 'en');
    expect(r.demo).toBe(true);
    expect(r.text).toBe(demoTranslate('Cốm làng Vòng', 'en'));
  });

  it('chuỗi rỗng thì không dịch', async () => {
    expect((await translateText('   ', 'ko')).text).toBe('');
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
