import { ZONE_COLORS, tr, type Lang } from '@mtll/shared';
import { useContent } from '../state/content';

interface Props {
  lang: Lang;
  activeZone?: string | null;
  onZonePress: (zoneId: string) => void;
  onStallPress: (stallId: string) => void;
}

const FACILITY_ICON = { wc: 'WC', medical: '+', info: 'i', parking: 'P', gate: '' } as const;

/**
 * UC02 Xem bản đồ lễ hội: chạm vào khu để thử nghe thuyết minh, chạm vào gian để xem chi tiết.
 *
 * Bản đồ vẽ của lễ hội (khung 800 x 540), cùng toạ độ với web quản trị và app.
 */
export function FestivalMap({ lang, activeZone, onZonePress, onStallPress }: Props) {
  const { zones, stalls, facilities } = useContent();
  return (
    <svg viewBox="0 0 800 540" className="festival-map" role="img" aria-label="Bản đồ lễ hội">
      <rect x={20} y={20} width={760} height={470} rx={22} fill="none" stroke="var(--line)" strokeWidth={2} />
      <path d="M400 520V140" stroke="var(--walk)" strokeWidth={22} strokeLinecap="round" />
      <path d="M310 250H490" stroke="var(--walk)" strokeWidth={16} strokeLinecap="round" />
      <path d="M310 370H490" stroke="var(--walk)" strokeWidth={16} strokeLinecap="round" />
      {zones.map((z) => {
        const [x, y, w, h] = z.mapRect;
        const c = ZONE_COLORS[z.kind];
        const on = z.id === activeZone;
        return (
          <g key={z.id} className="tap" onClick={() => onZonePress(z.id)}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={14}
              fill={c}
              fillOpacity={on ? 0.3 : 0.13}
              stroke={c}
              strokeWidth={on ? 3 : 1.5}
              strokeDasharray={on ? undefined : '6 5'}
            />
            <text x={x + w / 2} y={y + 24} textAnchor="middle" fontSize={15} fontWeight={700} fill={c}>
              {tr(z.label, lang).toUpperCase()}
            </text>
          </g>
        );
      })}
      <ellipse cx={400} cy={300} rx={44} ry={28} fill="var(--water)" />
      <path d="M370 490h60" stroke="var(--accent)" strokeWidth={6} strokeLinecap="round" />
      <text x={400} y={514} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">
        {lang === 'vi' ? 'CỔNG CHÍNH' : 'MAIN GATE'}
      </text>
      {facilities
        .filter((f) => f.kind !== 'gate')
        .map((f) => (
          <g key={f.id} transform={`translate(${f.mapPos[0]} ${f.mapPos[1]})`}>
            <rect x={-11} y={-11} width={22} height={22} rx={5} fill="var(--surface)" stroke="var(--muted)" />
            <text y={4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink)">
              {FACILITY_ICON[f.kind]}
            </text>
          </g>
        ))}
      {stalls.map((s) => {
        const z = zones.find((x) => x.id === s.zoneId);
        return (
          <g
            key={s.id}
            className="tap"
            transform={`translate(${s.mapPos[0]} ${s.mapPos[1]})`}
            onClick={() => onStallPress(s.id)}
            role="button"
            aria-label={s.id}
          >
            {/* Vòng trong suốt lớn hơn để dễ chạm bằng ngón tay */}
            <circle r={24} fill="transparent" />
            <circle r={16} fill={z ? ZONE_COLORS[z.kind] : 'var(--muted)'} stroke="var(--surface)" strokeWidth={2} />
            <text y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
              {s.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
