import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapToLatLng, tr, ZONE_COLORS, type Lang } from '@mtll/shared';
import { useContent } from '../state/content';
import { useSettings } from '../state/settings';

export interface MyPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface Props {
  lang: Lang;
  activeZone?: string | null;
  /** Vị trí GPS của khách, có thì hiện chấm xanh như Google Maps. */
  me?: MyPosition | null;
  onZonePress: (zoneId: string) => void;
  onStallPress: (stallId: string) => void;
}

const FACILITY_ICON = { wc: 'WC', medical: '+', info: 'i', parking: 'P', gate: '⇩' } as const;

/** Bản đồ đường phố (OpenStreetMap) và ảnh vệ tinh (Esri): miễn phí, không cần khóa API. */
const LAYERS = {
  street: () =>
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: '© OpenStreetMap',
    }),
  satellite: () =>
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: '© Esri',
    }),
};

/**
 * UC02 Xem bản đồ lễ hội: bản đồ thật kéo, phóng to được (Leaflet).
 * Mỗi khu là một vòng tròn đúng tâm GPS và bán kính ban tổ chức đặt; chạm vào khu để thử nghe thuyết minh,
 * chạm vào gian để xem chi tiết. Vị trí gian và tiện ích đổi từ bản đồ vẽ sang GPS bằng mapToLatLng.
 */
export function FestivalMap({ lang, activeZone, me, onZonePress, onStallPress }: Props) {
  const { zones, stalls, facilities } = useContent();
  const { t } = useSettings();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const fitted = useRef(false);
  const content = useRef<L.LayerGroup | null>(null);
  const meLayer = useRef<L.LayerGroup | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const [layer, setLayer] = useState<keyof typeof LAYERS>('street');
  // Hàm bấm mới nhất, để không phải vẽ lại bản đồ mỗi lần trang cha render.
  const press = useRef({ onZonePress, onStallPress });
  useEffect(() => {
    press.current = { onZonePress, onStallPress };
  }, [onZonePress, onStallPress]);

  const fitFestival = () => {
    if (!map.current || zones.length === 0) return;
    const bounds = zones.map((z) => L.latLng(z.center.lat, z.center.lng).toBounds(z.radiusM * 2)).reduce((a, b) => a.extend(b));
    map.current.fitBounds(bounds, { padding: [12, 12] });
  };

  // Tạo bản đồ một lần.
  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { zoomSnap: 0.25, maxZoom: 20 });
    m.attributionControl.setPrefix(false);
    map.current = m;
    content.current = L.layerGroup().addTo(m);
    meLayer.current = L.layerGroup().addTo(m);
    // Đặt khung tạm để vẽ được ngay; có dữ liệu khu thì vừa khung lại (StrictMode tạo bản đồ hai lần nên phải đặt lại cờ).
    m.setView([10.7746, 106.6927], 18);
    fitted.current = false;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    tiles.current?.remove();
    tiles.current = LAYERS[layer]().addTo(map.current);
    tiles.current.bringToBack();
  }, [layer]);

  // Vừa khung lễ hội khi có dữ liệu lần đầu.
  useEffect(() => {
    if (fitted.current || zones.length === 0) return;
    fitted.current = true;
    fitFestival();
  });

  // Vẽ khu, gian, tiện ích.
  useEffect(() => {
    const g = content.current;
    if (!g) return;
    g.clearLayers();
    const toLatLng = mapToLatLng(zones);
    for (const z of zones) {
      const c = ZONE_COLORS[z.kind];
      const on = z.id === activeZone;
      L.circle([z.center.lat, z.center.lng], {
        radius: z.radiusM,
        color: c,
        weight: on ? 3 : 1.5,
        dashArray: on ? undefined : '6 5',
        fillColor: c,
        fillOpacity: on ? 0.3 : 0.14,
      })
        .bindTooltip(tr(z.label, lang).toUpperCase(), { permanent: true, direction: 'center', className: 'zone-label' })
        .on('click', () => press.current.onZonePress(z.id))
        .addTo(g);
    }
    for (const f of facilities) {
      L.marker(toLatLng(f.mapPos), {
        icon: L.divIcon({ className: 'fac-pin', html: FACILITY_ICON[f.kind], iconSize: [22, 22] }),
        keyboard: false,
      })
        .bindTooltip(tr(f.name, lang))
        .addTo(g);
    }
    for (const s of stalls) {
      const z = zones.find((x) => x.id === s.zoneId);
      L.marker(toLatLng(s.mapPos), {
        icon: L.divIcon({
          className: 'stall-pin',
          html: `<span style="background:${z ? ZONE_COLORS[z.kind] : '#888'}">${s.id}</span>`,
          iconSize: [28, 28],
        }),
        title: s.id,
      })
        .on('click', () => press.current.onStallPress(s.id))
        .addTo(g);
    }
  }, [zones, stalls, facilities, activeZone, lang]);

  // Chấm xanh vị trí của khách và vòng sai số.
  useEffect(() => {
    const g = meLayer.current;
    if (!g) return;
    g.clearLayers();
    if (!me) return;
    L.circle([me.lat, me.lng], { radius: me.accuracy, color: '#1a73e8', weight: 1, fillOpacity: 0.12 }).addTo(g);
    L.circleMarker([me.lat, me.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#1a73e8', fillOpacity: 1 }).addTo(g);
  }, [me]);

  return (
    <div className="real-map">
      <div ref={box} className="real-map-box" role="application" aria-label="Bản đồ lễ hội" />
      <div className="map-tools">
        <button className="map-btn" onClick={() => setLayer(layer === 'street' ? 'satellite' : 'street')}>
          {layer === 'street' ? t('map.satellite') : t('map.street')}
        </button>
        <button className="map-btn" onClick={fitFestival}>
          {t('map.fitFestival')}
        </button>
        {me && (
          <button className="map-btn" onClick={() => map.current?.setView([me.lat, me.lng], 19)}>
            {t('map.myLocation')}
          </button>
        )}
      </div>
    </div>
  );
}
