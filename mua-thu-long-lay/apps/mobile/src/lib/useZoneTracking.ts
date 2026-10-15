import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createZoneTracker, festival, getZone, type Zone } from '@mtll/shared';

export type GpsState = 'checking' | 'on' | 'denied' | 'unavailable';

/**
 * Theo dõi vị trí khách và báo khi khách đi vào một khu mới (geofence).
 * Khi không có GPS (máy ảo, khách từ chối quyền, đang ở xa lễ hội) vẫn dùng được
 * bằng `simulate(zoneId)` để giả lập vị trí, phục vụ demo.
 */
export function useZoneTracking(onEnter: (zone: Zone) => void) {
  const [zone, setZone] = useState<Zone | null>(null);
  const [gps, setGps] = useState<GpsState>('checking');
  const onEnterRef = useRef(onEnter);
  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    const tracker = createZoneTracker(festival.zones, 2);

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setGps('denied');
          return;
        }
        setGps('on');
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 3, timeInterval: 3000 }, (loc) => {
          const entered = tracker.update({ lat: loc.coords.latitude, lng: loc.coords.longitude }, loc.coords.accuracy ?? 0);
          if (entered === undefined) return;
          setZone(entered);
          if (entered) onEnterRef.current(entered);
        });
      } catch {
        if (!cancelled) setGps('unavailable');
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  const simulate = useCallback((zoneId: string) => {
    const z = getZone(zoneId);
    if (!z) return;
    setZone(z);
    onEnterRef.current(z);
  }, []);

  return { zone, gps, simulate };
}
