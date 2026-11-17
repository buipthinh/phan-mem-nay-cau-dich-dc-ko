import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapToLatLng, ZONE_COLORS, type LatLng, type Stall, type Zone } from '@mtll/shared';

interface Props {
  zones: Zone[];
  stalls: Stall[];
  /** Khu đang sửa: vẽ đậm, kéo được tâm. */
  editZoneId?: string;
  /** Kéo chấm tâm hoặc bấm vào bản đồ thì báo toạ độ mới. */
  onMoveCenter?: (center: LatLng) => void;
}

/**
 * UC11: bản đồ thật (OpenStreetMap, giống bản đồ trên trang khách) để đặt vùng GPS của khu.
 * Vòng tròn là vùng tự đọc thuyết minh, đúng tâm và bán kính đang nhập.
 */
export function FestivalMap({ zones, stalls, editZoneId, onMoveCenter }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const fitted = useRef(false);
  const group = useRef<L.LayerGroup | null>(null);
  const move = useRef(onMoveCenter);
  useEffect(() => {
    move.current = onMoveCenter;
  }, [onMoveCenter]);

  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { zoomSnap: 0.25, maxZoom: 20 });
    m.attributionControl.setPrefix(false);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(m);
    m.on('click', (e) => move.current?.({ lat: round(e.latlng.lat), lng: round(e.latlng.lng) }));
    group.current = L.layerGroup().addTo(m);
    // Đặt khung tạm để vẽ được ngay; có dữ liệu khu thì vừa khung lại (StrictMode tạo bản đồ hai lần nên phải đặt lại cờ).
    m.setView([10.7746, 106.6927], 18);
    fitted.current = false;
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Lần đầu: vừa khung tất cả các khu.
  useEffect(() => {
    if (!map.current || fitted.current || zones.length === 0) return;
    fitted.current = true;
    map.current.fitBounds(
      zones.map((z) => L.latLng(z.center.lat, z.center.lng).toBounds(z.radiusM * 2)).reduce((a, b) => a.extend(b)),
      {
        padding: [16, 16],
      },
    );
  }, [zones]);

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.clearLayers();
    const toLatLng = mapToLatLng(zones);
    for (const z of zones) {
      const c = ZONE_COLORS[z.kind];
      const on = z.id === editZoneId;
      L.circle([z.center.lat, z.center.lng], {
        radius: z.radiusM,
        color: c,
        weight: on ? 3 : 1,
        dashArray: on ? undefined : '6 5',
        fillColor: c,
        fillOpacity: on ? 0.25 : 0.08,
        interactive: false,
      })
        .bindTooltip(`${z.id} · ${z.label.vi.toUpperCase()}`, { permanent: !on, direction: 'center', className: 'zone-label' })
        .addTo(g);
      if (on) {
        L.marker([z.center.lat, z.center.lng], {
          draggable: true,
          icon: L.divIcon({ className: 'center-pin', iconSize: [18, 18] }),
          title: 'Kéo để dời tâm khu',
        })
          .on('dragend', (e) => {
            const p = (e.target as L.Marker).getLatLng();
            move.current?.({ lat: round(p.lat), lng: round(p.lng) });
          })
          .addTo(g);
      }
    }
    for (const s of stalls) {
      const z = zones.find((x) => x.id === s.zoneId);
      L.marker(toLatLng(s.mapPos), {
        icon: L.divIcon({
          className: 'stall-pin',
          html: `<span style="background:${z ? ZONE_COLORS[z.kind] : '#888'}">${s.id}</span>`,
          iconSize: [28, 28],
        }),
        interactive: false,
      }).addTo(g);
    }
  }, [zones, stalls, editZoneId]);

  return <div ref={box} className="real-map" role="application" aria-label="Bản đồ lễ hội" />;
}

/** 5 chữ số thập phân ≈ 1 m, đủ cho vùng GPS. */
const round = (v: number) => Math.round(v * 1e5) / 1e5;
