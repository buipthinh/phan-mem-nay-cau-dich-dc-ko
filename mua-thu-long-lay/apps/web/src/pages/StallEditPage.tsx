import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { stallQrValue, type Lang, type Localized, type Stall } from '@mtll/shared';
import { TranslationPanel } from '../components/TranslationPanel';
import { useStore } from '../lib/store';

type TextKey = 'name' | 'description' | 'price' | 'allergens';

export function StallEditPage() {
  const { id = '' } = useParams();
  const { data, updateStall, removeStall, setTranslation } = useStore();
  const navigate = useNavigate();
  const stall = data.stalls.find((s) => s.id === id);
  const [qr, setQr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (stall) QRCode.toDataURL(stallQrValue(stall.id), { margin: 1, width: 240 }).then(setQr, () => setQr(''));
  }, [stall]);

  if (!stall) {
    return (
      <div className="page">
        <p>Không tìm thấy gian hàng {id}.</p>
        <Link to="/stalls">Quay lại danh sách</Link>
      </div>
    );
  }

  const key = `stall:${stall.id}`;
  const setVi = (field: TextKey, text: string) => {
    const current: Localized = stall[field] ?? { vi: '' };
    updateStall({ ...stall, [field]: { ...current, vi: text } } as Stall, true);
  };
  const setLang = (lang: Exclude<Lang, 'vi'>, changes: Record<string, string>) => {
    const next = { ...stall };
    for (const [field, text] of Object.entries(changes)) {
      const f = field as TextKey;
      next[f] = { ...(stall[f] ?? { vi: '' }), [lang]: text } as Localized;
    }
    updateStall(next as Stall, false);
  };

  return (
    <div className="page">
      <header className="page-head">
        <Link to="/stalls" className="hint">
          ← Danh sách gian hàng
        </Link>
        <h1>
          {stall.id} · {stall.name.vi}
        </h1>
      </header>

      <div className="grid-2 wide-left">
        <section className="card form">
          <h3>Nội dung tiếng Việt (bản gốc)</h3>
          <label className="label" htmlFor="f-name">
            Tên gian hàng
          </label>
          <input id="f-name" value={stall.name.vi} onChange={(e) => setVi('name', e.target.value)} />
          <label className="label" htmlFor="f-desc">
            Mô tả, nội dung thuyết minh
          </label>
          <textarea id="f-desc" rows={4} value={stall.description.vi} onChange={(e) => setVi('description', e.target.value)} />
          <div className="grid-2">
            <div>
              <label className="label" htmlFor="f-price">
                Giá
              </label>
              <input id="f-price" value={stall.price.vi} onChange={(e) => setVi('price', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="f-allergen">
                Thành phần dị ứng
              </label>
              <input
                id="f-allergen"
                value={stall.allergens?.vi ?? ''}
                placeholder="Bỏ trống nếu không phải đồ ăn"
                onChange={(e) => setVi('allergens', e.target.value)}
              />
            </div>
          </div>
          <label className="label" htmlFor="f-zone">
            Khu
          </label>
          <select id="f-zone" value={stall.zoneId} onChange={(e) => updateStall({ ...stall, zoneId: e.target.value }, false)}>
            {data.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.id} · {z.name.vi}
              </option>
            ))}
          </select>
          <p className="hint">Sửa bản tiếng Việt sẽ chuyển các bản dịch đã có sang trạng thái "Cần dịch lại".</p>
        </section>

        <section className="card qr-card">
          <h3>Mã QR</h3>
          {qr && <img src={qr} alt={`Mã QR của gian ${stall.id}`} width={200} height={200} />}
          <code>{stallQrValue(stall.id)}</code>
          <Link className="btn" to="/qr">
            In mã QR
          </Link>
          {confirmDelete ? (
            <div className="confirm">
              <p>Xoá gian {stall.id}? Mã QR đã in sẽ không dùng được nữa.</p>
              <div className="row">
                <button
                  className="btn danger"
                  onClick={() => {
                    removeStall(stall.id);
                    navigate('/stalls');
                  }}
                >
                  Xoá
                </button>
                <button className="btn" onClick={() => setConfirmDelete(false)}>
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <button className="btn ghost-danger" onClick={() => setConfirmDelete(true)}>
              Xoá gian hàng
            </button>
          )}
        </section>
      </div>

      <TranslationPanel
        fields={[
          { key: 'name', label: 'Tên', value: stall.name },
          { key: 'description', label: 'Mô tả', value: stall.description, multiline: true },
          { key: 'price', label: 'Giá', value: stall.price },
          ...(stall.allergens?.vi ? [{ key: 'allergens', label: 'Dị ứng', value: stall.allergens }] : []),
        ]}
        statuses={data.translation[key] ?? {}}
        onFieldsChange={setLang}
        onStatus={(lang, st) => setTranslation(key, lang, st)}
      />
    </div>
  );
}
