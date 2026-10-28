import type { LatLng, Zone } from './types';

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Khoảng cách giữa hai điểm GPS theo công thức haversine, tính bằng mét. */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Tìm khu chứa vị trí hiện tại (geofence hình tròn).
 * Nếu vị trí nằm trong nhiều vùng, chọn khu có tâm gần nhất.
 * `accuracyM` là sai số GPS máy báo về: sai số quá lớn thì không kết luận.
 */
export function findZone(pos: LatLng, zones: readonly Zone[], accuracyM = 0, maxAccuracyM = 50): Zone | null {
  if (accuracyM > maxAccuracyM) return null;
  let best: { zone: Zone; d: number } | null = null;
  for (const zone of zones) {
    const d = distanceM(pos, zone.center);
    if (d <= zone.radiusM && (!best || d < best.d)) best = { zone, d };
  }
  return best?.zone ?? null;
}

/**
 * UC02, UC03: quyết định khách vừa đi vào khu nào từ toạ độ GPS.
 *
 * Bộ theo dõi khu có chống nhiễu: GPS ngoài trời hay nhảy vài mét, nên chỉ đổi khu
 * khi đọc được cùng một kết quả `confirmReadings` lần liên tiếp.
 * Hàm trả về khu mới khi khách vừa đi vào khu đó, các lần khác trả về undefined.
 */
export function createZoneTracker(zones: readonly Zone[], confirmReadings = 2) {
  let current: string | null = null;
  let candidate: string | null = null;
  let count = 0;

  return {
    get current() {
      return current;
    },
    update(pos: LatLng, accuracyM = 0): Zone | null | undefined {
      const zone = findZone(pos, zones, accuracyM);
      const id = zone?.id ?? null;
      if (id === current) {
        candidate = null;
        count = 0;
        return undefined;
      }
      if (id === candidate) count += 1;
      else {
        candidate = id;
        count = 1;
      }
      if (count < confirmReadings) return undefined;
      current = id;
      candidate = null;
      count = 0;
      return zone;
    },
    reset() {
      current = null;
      candidate = null;
      count = 0;
    },
  };
}
