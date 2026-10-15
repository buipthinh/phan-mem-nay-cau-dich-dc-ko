import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ZONE_COLORS, type Lang, type Stall } from '@mtll/shared';
import { FestivalMap } from '../components/FestivalMap';
import { useStore, type TranslationStatus } from '../lib/store';

const LANG_SHORT: [Lang, string][] = [
  ['en', 'EN'],
  ['zh', 'ZH'],
  ['ko', 'KO'],
];

export function StallsPage() {
  const { data, addStall } = useStore();
  const navigate = useNavigate();
  const [zone, setZone] = useState('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.stalls.filter(
      (s) => (zone === 'all' || s.zoneId === zone) && (!q || s.id.toLowerCase().includes(q) || s.name.vi.toLowerCase().includes(q)),
    );
  }, [data.stalls, zone, query]);

  function createStall() {
    const zoneId = zone === 'all' ? 'A' : zone;
    const z = data.zones.find((x) => x.id === zoneId)!;
    const prefix = z.kind === 'food' ? 'F' : z.kind === 'game' ? 'G' : 'T';
    let n = 1;
    while (data.stalls.some((s) => s.id === `${prefix}${n}`)) n++;
    const [x, y, w, h] = z.mapRect;
    const stall: Stall = {
      id: `${prefix}${n}`,
      zoneId,
      kind: z.kind === 'food' ? 'food' : z.kind === 'game' ? 'game' : 'craft',
      name: { vi: 'Gian hàng mới' },
      description: { vi: '' },
      price: { vi: '' },
      mapPos: [Math.round(x + w / 2), Math.round(y + h / 2)],
    };
    addStall(stall);
    navigate(`/stalls/${stall.id}`);
  }

  return (
    <div className="page">
      <header className="page-head row between">
        <div>
          <span className="eyebrow">{data.stalls.length} gian hàng</span>
          <h1>Gian hàng</h1>
        </div>
        <button className="btn primary" onClick={createStall}>
          Thêm gian hàng
        </button>
      </header>

      <div className="grid-map">
        <section className="card">
          <div className="row filters">
            <label className="sr-only" htmlFor="stall-search">
              Tìm gian hàng
            </label>
            <input id="stall-search" placeholder="Tìm theo mã hoặc tên" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className="sr-only" htmlFor="stall-zone">
              Lọc theo khu
            </label>
            <select id="stall-zone" value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="all">Tất cả khu</option>
              {data.zones
                .filter((z) => z.kind !== 'stage' && z.kind !== 'plaza')
                .map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.id} · {z.name.vi}
                  </option>
                ))}
            </select>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên gian hàng</th>
                  <th>Giá</th>
                  <th>Bản dịch</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const z = data.zones.find((x) => x.id === s.zoneId);
                  const st = data.translation[`stall:${s.id}`] ?? {};
                  return (
                    <tr key={s.id} onClick={() => navigate(`/stalls/${s.id}`)} className="clickable">
                      <td>
                        <span className="code" style={{ background: z ? ZONE_COLORS[z.kind] : undefined }}>
                          {s.id}
                        </span>
                      </td>
                      <td>
                        <Link to={`/stalls/${s.id}`} onClick={(e) => e.stopPropagation()}>
                          {s.name.vi}
                        </Link>
                        {s.suggested && <span className="tag">đề xuất</span>}
                      </td>
                      <td className="num">{s.price.vi || '—'}</td>
                      <td>
                        <div className="row tight">
                          {LANG_SHORT.map(([l, short]) => (
                            <span key={l} className={`badge small st-${(st[l] as TranslationStatus) ?? 'missing'}`}>
                              {short}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="hint">
                      Không có gian hàng nào khớp bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="hint legend">
            <span className="badge small st-approved">Đã duyệt</span>
            <span className="badge small st-draft">Bản nháp</span>
            <span className="badge small st-outdated">Cần dịch lại</span>
            <span className="badge small st-missing">Chưa dịch</span>
          </p>
        </section>
        <section className="card">
          <h3>Vị trí trên bản đồ</h3>
          <FestivalMap zones={data.zones} stalls={rows} onSelectStall={(id) => navigate(`/stalls/${id}`)} />
        </section>
      </div>
    </div>
  );
}
