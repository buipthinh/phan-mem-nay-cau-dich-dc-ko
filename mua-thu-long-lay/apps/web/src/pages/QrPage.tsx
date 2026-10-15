import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { festival, stallQrValue } from '@mtll/shared';
import { useStore } from '../lib/store';

/** Trang in mã QR: mỗi thẻ có mã, tên gian hàng và lời nhắn 4 thứ tiếng. Dùng lệnh in của trình duyệt. */
export function QrPage() {
  const { data } = useStore();
  const [zone, setZone] = useState('all');
  const [codes, setCodes] = useState<Record<string, string>>({});
  const stalls = data.stalls.filter((s) => zone === 'all' || s.zoneId === zone);

  useEffect(() => {
    let alive = true;
    Promise.all(data.stalls.map(async (s) => [s.id, await QRCode.toDataURL(stallQrValue(s.id), { margin: 1, width: 320 })] as const)).then(
      (pairs) => alive && setCodes(Object.fromEntries(pairs)),
      () => alive && setCodes({}),
    );
    return () => {
      alive = false;
    };
  }, [data.stalls]);

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
