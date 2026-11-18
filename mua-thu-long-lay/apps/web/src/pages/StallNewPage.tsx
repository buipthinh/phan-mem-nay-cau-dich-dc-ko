import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';

/** UC12: trang thêm gian hàng mới. Chọn khu, nhập mã và nội dung, bấm "Tạo gian hàng" mới lưu. */
export function StallNewPage() {
  const { data, addStall } = useStore();
  const navigate = useNavigate();
  const zones = data.zones.filter((z) => z.kind !== 'stage' && z.kind !== 'plaza');

  // Gợi ý mã tiếp theo của khu (F1, F2... hoặc G, T), chỉ để điền sẵn, người dùng sửa được.
  const nextCode = (zid: string) => {
    const z = data.zones.find((x) => x.id === zid);
    const prefix = z?.kind === 'food' ? 'F' : z?.kind === 'game' ? 'G' : 'T';
    let n = 1;
    while (data.stalls.some((s) => s.id === `${prefix}${n}`)) n++;
    return `${prefix}${n}`;
  };

  const [zoneId, setZoneId] = useState(zones[0]?.id ?? '');
  const [code, setCode] = useState(nextCode(zones[0]?.id ?? ''));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [allergens, setAllergens] = useState('');
  const [error, setError] = useState('');

  function create() {
    const z = data.zones.find((x) => x.id === zoneId);
    const id = code.trim().toUpperCase();
    if (!z || !id || !name.trim()) return;
    if (data.stalls.some((s) => s.id === id)) {
      setError(`Mã ${id} đã có, chọn mã khác.`);
      return;
    }
    const [x, y, w, h] = z.mapRect;
    addStall({
      id,
      zoneId: z.id,
      kind: z.kind === 'food' ? 'food' : z.kind === 'game' ? 'game' : 'craft',
      name: { vi: name.trim() },
      description: { vi: description },
      price: { vi: price },
      ...(allergens.trim() ? { allergens: { vi: allergens.trim() } } : {}),
      mapPos: [Math.round(x + w / 2), Math.round(y + h / 2)],
    });
    navigate(`/stalls/${id}`); // mở trang sửa để thêm ảnh và dịch
  }

  return (
    <div className="page">
      <header className="page-head">
        <Link to="/points" className="hint">
          ← Điểm thuyết minh
        </Link>
        <h1>Thêm gian hàng</h1>
      </header>
      <section className="card form">
        <div className="grid-2">
          <div>
            <label className="label" htmlFor="n-zone">
              Khu
            </label>
            <select
              id="n-zone"
              value={zoneId}
              onChange={(e) => {
                setZoneId(e.target.value);
                setCode(nextCode(e.target.value));
                setError('');
              }}
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.id} · {z.name.vi}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="n-code">
              Mã gian (in trên mã QR)
            </label>
            <input
              id="n-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
            />
          </div>
        </div>
        <label className="label" htmlFor="n-name">
          Tên gian hàng
        </label>
        <input id="n-name" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="label" htmlFor="n-desc">
          Mô tả, nội dung thuyết minh
        </label>
        <textarea id="n-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid-2">
          <div>
            <label className="label" htmlFor="n-price">
              Giá
            </label>
            <input id="n-price" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="n-allergen">
              Thành phần dị ứng
            </label>
            <input
              id="n-allergen"
              value={allergens}
              placeholder="Bỏ trống nếu không phải đồ ăn"
              onChange={(e) => setAllergens(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button className="btn primary" onClick={create} disabled={!name.trim() || !code.trim()}>
            Tạo gian hàng
          </button>
          <Link className="btn" to="/points">
            Huỷ
          </Link>
        </div>
        <p className="hint">Sau khi tạo, trang kế tiếp cho thêm ảnh, xem mã QR và dịch sang các ngôn ngữ khác.</p>
      </section>
    </div>
  );
}