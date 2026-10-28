import { ZONE_COLORS, type Stall, type Zone } from '@mtll/shared';

interface Props {
  zones: Zone[];
  stalls: Stall[];
  highlight?: string;
  onSelectStall?: (id: string) => void;
}

/** Bản đồ vẽ của lễ hội, cùng toạ độ với bản đồ trên trang khách. */
export function FestivalMap({ zones, stalls, highlight, onSelectStall }: Props) {
  return (
    <svg className="map" viewBox="0 0 800 540" role="img" aria-label="Bản đồ lễ hội">
      <rect x="20" y="20" width="760" height="470" rx="22" fill="none" stroke="var(--line)" strokeWidth="2" />
      <g fill="none" stroke="var(--walk)" strokeLinecap="round">
        <path d="M400 520V140" strokeWidth="22" />
        <path d="M310 250H490" strokeWidth="16" />
        <path d="M310 370H490" strokeWidth="16" />
      </g>
      {zones.map((z) => {
        const [x, y, w, h] = z.mapRect;
        const c = ZONE_COLORS[z.kind];
        return (
          <g key={z.id}>
            <rect x={x} y={y} width={w} height={h} rx="14" fill={c} fillOpacity="0.14" stroke={c} strokeDasharray="6 5" />
            <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize="13" fontWeight="700" fill={c}>
              {z.id} · {z.label.vi.toUpperCase()}
            </text>
          </g>
        );
      })}
      <ellipse cx="400" cy="300" rx="44" ry="28" fill="var(--water)" />
      <path d="M370 490h60" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />
      <text x="400" y="512" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">
        CỔNG CHÍNH
      </text>
      {stalls.map((s) => {
        const zone = zones.find((z) => z.id === s.zoneId);
        const c = zone ? ZONE_COLORS[zone.kind] : '#888';
        const on = highlight === s.id;
        return (
          <g
            key={s.id}
            transform={`translate(${s.mapPos[0]} ${s.mapPos[1]})`}
            className={onSelectStall ? 'pin clickable' : 'pin'}
            onClick={() => onSelectStall?.(s.id)}
          >
            <circle r={on ? 17 : 14} fill={c} stroke={on ? 'var(--ink)' : 'var(--surface)'} strokeWidth={on ? 3 : 2} />
            <text y="3.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">
              {s.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
