import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { festival, tr, type Lang } from '@mtll/shared';
import { colors } from '../theme';

interface Props {
  lang: Lang;
  activeZone?: string | null;
  onZonePress: (zoneId: string) => void;
  onStallPress: (stallId: string) => void;
}

/**
 * Bản đồ vẽ của lễ hội (khung 800 x 540), cùng toạ độ với web quản trị.
 * Vẽ bằng SVG nên không cần khoá API bản đồ và vẫn hiện khi mất mạng.
 */
export function FestivalMapView({ lang, activeZone, onZonePress, onStallPress }: Props) {
  return (
    <Svg viewBox="0 0 800 540" width="100%" style={{ aspectRatio: 800 / 540 }}>
      <Rect x={20} y={20} width={760} height={470} rx={22} fill="none" stroke={colors.line} strokeWidth={2} />
      <Path d="M400 520V140" stroke={colors.walk} strokeWidth={22} strokeLinecap="round" />
      <Path d="M310 250H490" stroke={colors.walk} strokeWidth={16} strokeLinecap="round" />
      <Path d="M310 370H490" stroke={colors.walk} strokeWidth={16} strokeLinecap="round" />
      {festival.zones.map((z) => {
        const [x, y, w, h] = z.mapRect;
        const c = colors.zone[z.kind];
        const on = z.id === activeZone;
        return (
          <G key={z.id} onPress={() => onZonePress(z.id)}>
            <Rect
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
            <SvgText x={x + w / 2} y={y + 24} textAnchor="middle" fontSize={15} fontWeight="700" fill={c}>
              {tr(z.label, lang).toUpperCase()}
            </SvgText>
          </G>
        );
      })}
      <Ellipse cx={400} cy={300} rx={44} ry={28} fill={colors.water} />
      <Rect x={555} y={84} width={140} height={44} rx={6} fill={colors.zone.stage} opacity={0.85} />
      <Path d="M370 490h60" stroke={colors.accent} strokeWidth={6} strokeLinecap="round" />
      <SvgText x={400} y={514} textAnchor="middle" fontSize={14} fontWeight="700" fill={colors.ink}>
        {lang === 'vi' ? 'CỔNG CHÍNH' : 'MAIN GATE'}
      </SvgText>
      {festival.facilities
        .filter((f) => f.kind !== 'gate')
        .map((f) => (
          <G key={f.id} x={f.mapPos[0]} y={f.mapPos[1]}>
            <Rect x={-11} y={-11} width={22} height={22} rx={5} fill={colors.surface} stroke={colors.muted} />
            <SvgText y={4} textAnchor="middle" fontSize={10} fontWeight="700" fill={colors.ink}>
              {f.kind === 'wc' ? 'WC' : f.kind === 'medical' ? '+' : f.kind === 'info' ? 'i' : 'P'}
            </SvgText>
          </G>
        ))}
      {festival.stalls.map((s) => {
        const z = festival.zones.find((x) => x.id === s.zoneId)!;
        return (
          <G key={s.id} x={s.mapPos[0]} y={s.mapPos[1]} onPress={() => onStallPress(s.id)}>
            {/* Vòng trong suốt lớn hơn để dễ chạm bằng ngón tay */}
            <Circle r={24} fill="transparent" />
            <Circle r={16} fill={colors.zone[z.kind]} stroke={colors.surface} strokeWidth={2} />
            <SvgText y={4} textAnchor="middle" fontSize={11} fontWeight="700" fill="#fff">
              {s.id}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
