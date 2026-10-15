import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { festival, LANGS, ZONE_COLORS } from '@mtll/shared';
import { useStore } from '../lib/store';
import { sampleStats } from '../lib/stats';

export function DashboardPage() {
  const { data } = useStore();
  const stats = useMemo(() => sampleStats(data.stalls), [data.stalls]);
  const pending = Object.values(data.translation)
    .flatMap((t) => Object.values(t))
    .filter((s) => s !== 'approved').length;
  const maxHour = Math.max(...stats.byHour.map((h) => h.scans));
  const top = stats.byStall.slice(0, 6);
  const maxTop = top[0]?.scans ?? 1;

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">
          {festival.days.map((d) => d.split('-').reverse().join('/')).join(' và ')} · {festival.opens} đến {festival.closes}
        </span>
        <h1>Tổng quan</h1>
        <p className="hint">Số liệu lượt quét và lượt nghe dưới đây là dữ liệu mẫu cho demo.</p>
      </header>

      <div className="kpis">
        <div className="kpi">
          <span className="label">Gian hàng</span>
          <strong>{data.stalls.length}</strong>
          <span className="hint">{data.zones.length} khu</span>
        </div>
        <div className="kpi">
          <span className="label">Lượt quét QR</span>
          <strong>{stats.totalScans.toLocaleString('vi-VN')}</strong>
          <span className="hint">cả 2 ngày</span>
        </div>
        <div className="kpi">
          <span className="label">Lượt nghe thuyết minh</span>
          <strong>{stats.totalPlays.toLocaleString('vi-VN')}</strong>
          <span className="hint">{Math.round((stats.totalPlays / stats.totalScans) * 100)}% số lượt quét</span>
        </div>
        <div className="kpi">
          <span className="label">Bản dịch chờ xử lý</span>
          <strong className={pending ? 'warn' : ''}>{pending}</strong>
          <Link to="/stalls" className="hint">
            Xem gian hàng
          </Link>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Lượt quét theo giờ</h3>
          <div className="bars" role="img" aria-label="Biểu đồ lượt quét QR theo giờ, cao nhất lúc 19 giờ">
            {stats.byHour.map((h) => (
              <div className="bar-col" key={h.hour}>
                <div className="bar" style={{ height: `${(h.scans / maxHour) * 100}%` }} title={`${h.scans} lượt`} />
                <span>{h.hour}h</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h3>Ngôn ngữ khách dùng</h3>
          <ul className="lang-share">
            {stats.byLang.map((l) => (
              <li key={l.lang}>
                <span>{LANGS.find((x) => x.code === l.lang)?.label}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${l.share * 100}%` }} />
                </div>
                <span className="num">{Math.round(l.share * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h3>Gian hàng được quét nhiều nhất</h3>
        <ul className="top">
          {top.map(({ stall, scans }) => {
            const zone = data.zones.find((z) => z.id === stall.zoneId);
            return (
              <li key={stall.id}>
                <span className="code" style={{ background: zone ? ZONE_COLORS[zone.kind] : undefined }}>
                  {stall.id}
                </span>
                <Link to={`/stalls/${stall.id}`}>{stall.name.vi}</Link>
                <div className="track">
                  <div className="fill" style={{ width: `${(scans / maxTop) * 100}%` }} />
                </div>
                <span className="num">{scans}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
