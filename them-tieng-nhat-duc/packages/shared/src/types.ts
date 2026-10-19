/** Ngôn ngữ hệ thống hỗ trợ. Tiếng Việt là ngôn ngữ gốc, các ngôn ngữ khác được dịch tự động. */
export type Lang = 'vi' | 'en' | 'zh' | 'ko' | 'ja' | 'de';

/** Một đoạn chữ có nhiều bản dịch. Bản tiếng Việt luôn có, các bản khác có thể còn thiếu. */
export type Localized = { vi: string } & Partial<Record<Exclude<Lang, 'vi'>, string>>;

export type ZoneKind = 'food' | 'game' | 'craft' | 'stage' | 'plaza';
export type StallKind = 'food' | 'game' | 'craft';

/** Toạ độ GPS (độ thập phân). */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Hình chữ nhật trên bản đồ vẽ (đơn vị của khung 800 x 540): x, y, rộng, cao. */
export type MapRect = [number, number, number, number];

export interface Zone {
  id: string;
  kind: ZoneKind;
  name: Localized;
  /** Nhãn ngắn in trên bản đồ. */
  label: Localized;
  /** Nội dung thuyết minh tự đọc khi khách đi vào khu. */
  narration: Localized;
  /** Tâm vùng GPS (geofence) của khu. */
  center: LatLng;
  /** Bán kính vùng GPS, tính bằng mét. */
  radiusM: number;
  mapRect: MapRect;
}

export interface Stall {
  id: string;
  zoneId: string;
  kind: StallKind;
  name: Localized;
  description: Localized;
  price: Localized;
  allergens?: Localized;
  /** Vị trí ghim trên bản đồ vẽ. */
  mapPos: [number, number];
  /** Gian hàng nhóm đề xuất thêm (không có trong yêu cầu ban đầu). */
  suggested?: boolean;
}

export type ShowSlot = 'morning' | 'noon' | 'afternoon' | 'evening';

export interface Show {
  id: string;
  slot: ShowSlot;
  /** Giờ bắt đầu và kết thúc dạng HH:mm, lặp lại mỗi ngày lễ hội. */
  start: string;
  end: string;
  name: Localized;
  description: Localized;
}

export type FacilityKind = 'wc' | 'medical' | 'info' | 'parking' | 'gate';

export interface Facility {
  id: string;
  kind: FacilityKind;
  name: Localized;
  mapPos: [number, number];
}

export interface Festival {
  id: string;
  name: Localized;
  tagline: Localized;
  /** Các ngày diễn ra, dạng YYYY-MM-DD. */
  days: string[];
  opens: string;
  closes: string;
  location: Localized;
  /** Múi giờ của địa điểm, dùng để đặt lịch nhắc. */
  utcOffset: string;
  zones: Zone[];
  stalls: Stall[];
  shows: Show[];
  facilities: Facility[];
  /** Số tem cần để đổi quà ở trò chơi săn tem. */
  stampsForGift: number;
}
