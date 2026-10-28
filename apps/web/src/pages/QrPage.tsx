import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { festival, stallQrValue } from '@mtll/shared';
import { GuestQr } from '../components/GuestQr';
import { useGuestUrl } from '../lib/guestUrl';
import { useStore } from '../lib/store';

/**
 * UC15 In mã QR.
 * - Phần trên: mã QR mở trang chủ web khách, để quét thẳng trên màn hình (thay cho bảng QR ở cổng vào).
 * - Phần dưới: mã QR của từng gian, in ra dán ở gian. Mỗi mã là link …/#/s/<mã gian>, quét là mở gian đó và nhận tem.
 */
export function QrPage() {
  const { data } = useStore();
  const [zone, setZone] = useState('all');
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [guestUrl, setGuestUrl, resetGuestUrl] = useGuestUrl();
  const stalls = data.stalls.filter((s) => zone === 'all' || s.zoneId === zone);

  useEffect(() => {
    let alive = true;
    Promise.all(
      data.stalls.map(async (s) => [s.id, await QRCode.toDataURL(stallQrValue(s.id, guestUrl), { margin: 1, width: 320 })] as const),
    ).then(
      (pairs) => alive && setCodes(Object.fromEntries(pairs)),
      () => alive && setCodes({}),
    );
    return () => {
      alive = false;
    };
  }, [data.stalls, guestUrl]);

  return (
    <div className="page">
      <header className="page-head row between no-print">
        <div>
          <span className="eyebrow">{stalls.length} mã</span>
          <h1>Mã QR gian hàng</h1>
        </div>
        <div className="row">
          <label className="sr-only" htmlFor="qr-zone">
            Lọc theo khu
          </label>
          <select id="qr-zone" value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="all">Tất cả khu</option>
            {data.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.id} · {z.name.vi}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => window.print()}>
            In
          </button>
        </div>
      </header>
      <section className="card no-print guest-entry">
        <GuestQr url={guestUrl} />
        <div className="guest-url">
          <h3>Quét để vào web khách</h3>
          <p className="hint">
            Mở camera điện thoại (cùng Wi‑Fi với laptop) và quét mã bên cạnh. Trình duyệt báo "không riêng tư" thì bấm Nâng cao → Tiếp tục.
          </p>
          <label htmlFor="guest-url">Địa chỉ web khách (dùng cho mọi mã QR)</label>
          <div className="row">
            <input id="guest-url" value={guestUrl} onChange={(e) => setGuestUrl(e.target.value)} spellCheck={false} />
            <button className="btn" onClick={resetGuestUrl}>
              Mặc định
            </button>
          </div>
          <p className="hint">
            Địa chỉ được đoán sẵn theo IP Wi‑Fi của laptop. Nếu điện thoại không vào được, sửa lại cho đúng IP rồi quét lại.
          </p>
        </div>
      </section>
      <div className="qr-grid">
        {stalls.map((s) => (
          <article className="qr-tile" key={s.id}>
            <span className="eyebrow">{festival.name.vi}</span>
            {codes[s.id] ? <img src={codes[s.id]} alt={`Mã QR gian ${s.id}`} /> : <div className="qr-ph" />}
            <strong>
              {s.id} · {s.name.vi}
            </strong>
            <span className="hint">Quét để nghe thuyết minh · Scan for audio guide · 扫码收听讲解 · 스캔하여 안내 듣기</span>
          </article>
        ))}
      </div>
    </div>
  );
}
