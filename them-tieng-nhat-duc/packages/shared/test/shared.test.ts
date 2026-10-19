import { describe, expect, it } from 'vitest';
import {
  addStamp,
  canRedeem,
  createZoneTracker,
  distanceM,
  festival,
  findZone,
  messages,
  nextShow,
  occurrences,
  parseStallCode,
  pickLang,
  reminderTimes,
  resolveText,
  stallQrValue,
  statusAt,
} from '../src';

const zoneA = festival.zones.find((z) => z.id === 'A')!;
const zoneB = festival.zones.find((z) => z.id === 'B')!;

describe('dữ liệu lễ hội', () => {
  it('có đúng 5 gian ẩm thực, 7 gian trò chơi, 4 gian trải nghiệm và 4 suất diễn', () => {
    const count = (kind: string) => festival.stalls.filter((s) => s.kind === kind).length;
    expect(count('food')).toBe(5);
    expect(count('game')).toBe(7);
    expect(count('craft')).toBe(4);
    expect(festival.shows).toHaveLength(4);
  });

  it('mã gian hàng không trùng và gian nào cũng thuộc một khu có thật', () => {
    const ids = festival.stalls.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const zoneIds = new Set(festival.zones.map((z) => z.id));
    for (const s of festival.stalls) expect(zoneIds.has(s.zoneId)).toBe(true);
  });

  it('các vùng GPS không chồng lên nhau', () => {
    const zs = festival.zones;
    for (let i = 0; i < zs.length; i++)
      for (let j = i + 1; j < zs.length; j++) expect(distanceM(zs[i].center, zs[j].center)).toBeGreaterThan(zs[i].radiusM + zs[j].radiusM);
  });

  it('mọi nội dung thuyết minh đều có bản tiếng Việt và tiếng Anh', () => {
    for (const z of festival.zones) {
      expect(z.narration.vi.length).toBeGreaterThan(20);
      expect(z.narration.en?.length ?? 0).toBeGreaterThan(20);
    }
  });
});

describe('đa ngôn ngữ', () => {
  it('chọn ngôn ngữ theo máy, không hỗ trợ thì dùng tiếng Anh', () => {
    expect(pickLang(['ko-KR', 'en-US'])).toBe('ko');
    expect(pickLang(['fr-FR', 'vi-VN'])).toBe('vi');
    expect(pickLang(['fr-FR'])).toBe('en');
  });

  it('thiếu bản tiếng Trung thì dùng tiếng Anh và báo là bản thay thế', () => {
    const r = resolveText({ vi: 'Xin chào', en: 'Hello' }, 'zh');
    expect(r).toEqual({ text: 'Hello', lang: 'en', isFallback: true });
  });

  it('bản dịch rỗng được coi như chưa có', () => {
    expect(resolveText({ vi: 'Xin chào', en: '  ' }, 'en').text).toBe('Xin chào');
  });

  it('6 ngôn ngữ giao diện có đủ các khoá như tiếng Việt', () => {
    const keys = Object.keys(messages.vi).sort();
    for (const lang of ['en', 'zh', 'ko', 'ja', 'de'] as const) expect(Object.keys(messages[lang]).sort()).toEqual(keys);
  });
});

describe('vùng GPS (geofence)', () => {
  it('đứng ở tâm khu A thì nhận ra khu A', () => {
    expect(findZone(zoneA.center, festival.zones)?.id).toBe('A');
  });

  it('ở xa mọi khu thì không thuộc khu nào', () => {
    expect(findZone({ lat: 10.78, lng: 106.7 }, festival.zones)).toBeNull();
  });

  it('sai số GPS quá lớn thì không kết luận', () => {
    expect(findZone(zoneA.center, festival.zones, 120)).toBeNull();
  });

  it('chỉ đổi khu khi đọc được 2 lần liên tiếp, tránh đọc thuyết minh vì GPS nhảy', () => {
    const tracker = createZoneTracker(festival.zones, 2);
    expect(tracker.update(zoneA.center)).toBeUndefined();
    expect(tracker.update(zoneA.center)?.id).toBe('A');
    expect(tracker.update(zoneB.center)).toBeUndefined();
    expect(tracker.update(zoneA.center)).toBeUndefined();
    expect(tracker.current).toBe('A');
  });
});

describe('mã QR', () => {
  it('đọc được mã từ link, chữ thường và chữ có khoảng trắng', () => {
    expect(parseStallCode(stallQrValue('F2'))).toBe('F2');
    expect(parseStallCode(' g7 ')).toBe('G7');
    expect(parseStallCode('https://mua-thu-long-lay.example/s/T4?src=poster')).toBe('T4');
  });

  it('từ chối nội dung không phải mã gian hàng', () => {
    expect(parseStallCode('')).toBeNull();
    expect(parseStallCode('https://example.com/hello')).toBeNull();
    expect(parseStallCode('ABC')).toBeNull();
  });
});

describe('lịch diễn', () => {
  it('có 8 suất trong 2 ngày, sắp theo thời gian', () => {
    const list = occurrences(festival);
    expect(list).toHaveLength(8);
    for (let i = 1; i < list.length; i++) expect(list[i].start >= list[i - 1].start).toBe(true);
  });

  it('lúc 12:10 ngày đầu thì suất hòa tấu đang diễn', () => {
    const now = new Date('2026-11-21T12:10:00+07:00');
    const o = nextShow(festival, now)!;
    expect(o.show.id).toBe('S2');
    expect(statusAt(o, now)).toBe('live');
  });

  it('nhắc giờ trước 15 phút và bỏ các mốc đã qua', () => {
    const now = new Date('2026-11-21T12:00:00+07:00');
    const times = reminderTimes(festival, 'S1', now);
    expect(times).toHaveLength(1);
    expect(times[0].at.toISOString()).toBe(new Date('2026-11-22T08:45:00+07:00').toISOString());
  });

  it('sau khi lễ hội kết thúc thì không còn suất nào', () => {
    expect(nextShow(festival, new Date('2026-11-23T00:00:00+07:00'))).toBeNull();
  });
});

describe('săn tem', () => {
  it('không cộng tem trùng và đủ 8 tem thì đổi được quà', () => {
    let card: string[] = [];
    for (const id of ['F1', 'F1', 'F2', 'G1', 'G2', 'G3', 'T1', 'T2']) card = addStamp(card, id).card;
    expect(card).toHaveLength(7);
    expect(canRedeem(card, festival.stampsForGift)).toBe(false);
    card = addStamp(card, 'T3').card;
    expect(canRedeem(card, festival.stampsForGift)).toBe(true);
  });
});
