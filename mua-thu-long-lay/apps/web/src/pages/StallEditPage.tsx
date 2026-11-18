import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { stallQrValue, type Lang, type Localized, type Stall } from '@mtll/shared';
import { StallImage } from '../components/StallImage';
import { TranslationPanel } from '../components/TranslationPanel';
import { useGuestUrl } from '../lib/guestUrl';
import { useScrollToTranslation } from '../lib/points';
import { useStore } from '../lib/store';

type TextKey = 'name' | 'description' | 'price' | 'allergens';

/**
 * UC12 Sửa / xoá một gian hàng, UC13 dịch và duyệt bản dịch của gian, UC15 xem mã QR của gian.
 */
export function StallEditPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const openLang = useScrollToTranslation(params);
  const { data, updateStall, removeStall, setTranslation } = useStore();
  const navigate = useNavigate();
  const stall = data.stalls.find((s) => s.id === id);
  const [qr, setQr] = useState('');
  const [guestUrl] = useGuestUrl();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(() => ({
    name: stall?.name.vi ?? '',
    description: stall?.description.vi ?? '',
    price: stall?.price.vi ?? '',
    allergens: stall?.allergens?.vi ?? '',
    zoneId: stall?.zoneId ?? '',
  }));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (stall) QRCode.toDataURL(stallQrValue(stall.id, guestUrl), { margin: 1, width: 240 }).then(setQr, () => setQr(''));
  }, [stall, guestUrl]);

  if (!stall) {
    return (
      <div className="page">
        <p>Không tìm thấy gian hàng {id}.</p>
        <Link to="/points">Quay lại danh sách điểm</Link>
      </div>
    );
  }

  const key = `stall:${stall.id}`;
  const dirty =
    draft.name !== stall.name.vi ||
    draft.description !== stall.description.vi ||
    draft.price !== stall.price.vi ||
    draft.allergens !== (stall.allergens?.vi ?? '') ||
    draft.zoneId !== stall.zoneId;
  const setField = (field: keyof typeof draft, text: string) => {
    setDraft((d) => ({ ...d, [field]: text }));
    setSaved(false);
  };
  const save = () => {
    const next: Stall = {
      ...stall,
      zoneId: draft.zoneId,
      name: { ...stall.name, vi: draft.name },
      description: { ...stall.description, vi: draft.description },
      price: { ...stall.price, vi: draft.price },
    };
    if (draft.allergens.trim() || stall.allergens) {
      next.allergens = { ...(stall.allergens ?? { vi: '' }), vi: draft.allergens };
    }
    const viChanged =
      draft.name !== stall.name.vi ||
      draft.description !== stall.description.vi ||
      draft.price !== stall.price.vi ||
      draft.allergens !== (stall.allergens?.vi ?? '');
    updateStall(next, viChanged); // viChanged = true thì các bản dịch chuyển sang "Cần dịch lại"
    setSaved(true);
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
        <Link to="/points" className="hint">
          ← Điểm thuyết minh
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
          <input id="f-name" value={draft.name} onChange={(e) => setField('name', e.target.value) } />
          <label className="label" htmlFor="f-desc">
            Mô tả, nội dung thuyết minh
          </label>
          <textarea id="f-desc" rows={4} value={draft.description} onChange={(e) => setField('description', e.target.value)} />
          <div className="grid-2">
            <div>
              <label className="label" htmlFor="f-price">
                Giá
              </label>
              <input id="f-price" value={draft.price} onChange={(e) => setField('price', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="f-allergen">
                Thành phần dị ứng
              </label>
              <input
                id="f-allergen"
                value={draft.allergens}
                placeholder="Bỏ trống nếu không phải đồ ăn"
                onChange={(e) => setField('allergens', e.target.value)}
              />
            </div>
          </div>
          <label className="label" htmlFor="f-zone">
            Khu
          </label>
          <select id="f-zone" value={draft.zoneId} onChange={(e) => setField('zoneId', e.target.value)}>
            {data.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.id} · {z.name.vi}
              </option>
            ))}
          </select>
          <p className="hint">Sửa bản tiếng Việt sẽ chuyển các bản dịch đã có sang trạng thái "Cần dịch lại".</p>
          <div className="row">
            <button className="btn primary" onClick={save} disabled={!dirty || !draft.name.trim()}>
              Lưu thay đổi
            </button>
            {saved && !dirty && <span className="hint">Đã lưu.</span>}
          </div>
        </section>

        <div className="side-stack">
          <StallImage
            url={stall.imageUrl}
            alt={stall.name.vi}
            onChange={(imageUrl) => {
              const next = { ...stall };
              if (imageUrl) next.imageUrl = imageUrl;
              else delete next.imageUrl;
              updateStall(next, false);
            }}
          />
          <section className="card qr-card">
            <h3>Mã QR</h3>
            {qr && <img src={qr} alt={`Mã QR của gian ${stall.id}`} width={200} height={200} />}
            <code>{stallQrValue(stall.id, guestUrl)}</code>
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
                      navigate('/points');
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
      </div>

      <TranslationPanel
        fields={[
          { key: 'name', label: 'Tên', value: stall.name },
          { key: 'description', label: 'Mô tả', value: stall.description, multiline: true },
          { key: 'price', label: 'Giá', value: stall.price },
          ...(stall.allergens?.vi ? [{ key: 'allergens', label: 'Dị ứng', value: stall.allergens }] : []),
        ]}
        statuses={data.translation[key] ?? {}}
        initialLang={openLang}
        onFieldsChange={setLang}
        onStatus={(lang, st) => setTranslation(key, lang, st)}
      />
    </div>
  );
}
