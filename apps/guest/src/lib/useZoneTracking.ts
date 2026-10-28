import { useCallback, useEffect, useRef, useState } from 'react';
import { createZoneTracker, type Zone } from '@mtll/shared';
import { useContent } from '../state/content';

export type GpsState = 'checking' | 'on' | 'denied' | 'unavailable';

/**
 * UC02, UC03: theo dõi GPS để biết khách đang đứng trong khu nào.
 *
 * Theo dõi vị trí khách bằng GPS của trình duyệt và báo khi khách đi vào khu mới.
 * Không có GPS (trang http, khách từ chối, ở xa lễ hội) thì dùng simulate(zoneId) để demo.
 */
export function useZoneTracking(onEnter: (zone: Zone) => void) {
  const { zones, getZone } = useContent();
  const [zone, setZone] = useState<Zone | null>(null);
  const [gps, setGps] = useState<GpsState>(() => (navigator.geolocation && window.isSecureContext ? 'checking' : 'unavailable'));
  const onEnterRef = useRef(onEnter);
  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  useEffect(() => {
    if (!navigator.geolocation || !window.isSecureContext) return;
    const tracker = createZoneTracker(zones, 2);
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        setGps('on');
        const entered = tracker.update({ lat: pos.coords.latitude, lng: pos.coords.longitude }, pos.coords.accuracy ?? 0);
        if (entered === undefined) return;
        setZone(entered);
        if (entered) onEnterRef.current(entered);
      },
      (err) => setGps(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, maximumAge: 3000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [zones]);

  const simulate = useCallback(
    (zoneId: string) => {
      const z = getZone(zoneId);
      if (!z) return;
      setZone(z);
      onEnterRef.current(z);
    },
    [getZone],
  );

  return { zone, gps, simulate };
}
