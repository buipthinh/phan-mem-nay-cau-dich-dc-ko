import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { festival, LANGS, ZONE_COLORS } from '@mtll/shared';
import { GuestQr } from '../components/GuestQr';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useGuestUrl } from '../lib/guestUrl';
import { useStore } from '../lib/store';
import { sampleStats, statsFromApi, type ApiStats } from '../lib/stats';

const hourOf = (hhmm: string) => Number(hhmm.split(':')[0]);
/** Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD (giống cách SQL Server trả về). */
const todayKey = () => new Date().toLocaleDateString('sv-SE');
const viDate = (day: string) => day.split('-').reverse().slice(0, 2).join('/');

/**
 * UC10 Tổng quan thống kê.
 * Có SQL Server: số liệu thật đếm từ bảng visit_events (GET /api/stats), tự cập nhật mỗi 5 giây.
 * Không có SQL Server (bản demo): dùng số liệu mẫu.
 */
export function DashboardPage() {
  const { data } = useStore();
  const { token } = useAuth();
  const [guestUrl] = useGuestUrl();
  const [real, setReal] = useState<ApiStats | null>(null);

  // Có database thì lấy số liệu thật, cập nhật mỗi 5 giây để thấy ngay khi có thêm máy truy cập.
  useEffect(() => {
    if (!token) return;
    let alive = true;
    const load = () =>
      api<ApiStats>('/stats', { token })
        .then((res) => alive && setReal(res))
        .catch(() => undefined);
    load();
    const timer = setInterval(load, 5_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token]);

  const stats = useMemo(
    () => (real ? statsFromApi(real, data.stalls, hourOf(festival.opens), hourOf(festival.closes)) : sampleStats(data.stalls)),
    [real, data.stalls],
  );
  const pending = Object.values(data.translation)
    .flatMap((t) => Object.values(t))
    .filter((s) => s !== 'approved').length;
  // Số người truy cập của 2 ngày lễ hội. Nếu hôm nay không phải ngày lễ hội (đang chạy thử) thì thêm dòng "Hôm nay".
  const days = festival.days.map((day, i) => ({ label: `Ngày ${i + 1} (${viDate(day)})`, visitors: stats.visitorsByDay[day] ?? 0 }));
  if (!festival.days.includes(todayKey())) days.push({ label: 'Hôm nay (chạy thử)', visitors: stats.visitorsByDay[todayKey()] ?? 0 });

  const maxHour = Math.max(1, ...stats.byHour.map((h) => h.scans));
  const top = stats.byStall.slice(0, 6);
  const maxTop = top[0]?.scans ?? 1;

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">
          {festival.days.map((d) => d.split('-').reverse().join('/')).join(' và ')} · {festival.opens} đến {festival.closes}
        </span>
        <h1>Tổng quan</h1>
        <p className="hint">
          {real
            ? 'Số liệu thật, đếm từ bảng visit_events trong SQL Server, tự cập nhật mỗi 5 giây.'
            : 'Chế độ demo không có SQL Server: số lượt quét dưới đây là dữ liệu mẫu.'}
        </p>
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
          <span className="label">Đang truy cập</span>
          {/* Số máy đang mở web khách: máy nào báo "còn mở" trong 60 giây gần nhất */}
          <strong className="live">{stats.online ?? '–'}</strong>
          <span className="hint">{stats.online === null ? 'cần SQL Server' : 'máy đang mở web khách'}</span>
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
          <h3>Khách truy cập theo ngày</h3>
          <ul className="day-list">
            {days.map((d) => (
              <li key={d.label}>
                <span>{d.label}</span>
                <strong>{d.visitors.toLocaleString('vi-VN')} người</strong>
              </li>
            ))}
          </ul>
          <p className="hint">Mỗi máy được đếm 1 lần mỗi ngày, bắt đầu từ 0.</p>
        </section>
        <section className="card">
          <h3>Quét để vào web khách</h3>
          <GuestQr url={guestUrl} size={160} />
          <Link to="/qr" className="hint">
            Đổi địa chỉ hoặc in mã QR gian hàng
          </Link>
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Lượt quét theo giờ</h3>
          <div className="bars" role="img" aria-label="Biểu đồ lượt quét QR theo giờ">
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
