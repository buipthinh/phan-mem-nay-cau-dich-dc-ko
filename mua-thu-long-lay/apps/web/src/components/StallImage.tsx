import { useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { mediaUrl, uploadImage } from '../lib/images';

interface Props {
  url?: string;
  alt: string;
  onChange: (url: string | undefined) => void;
}

/** UC12 Ảnh gian hàng: chọn hoặc kéo thả file ảnh vào khung, xem trước, đổi hoặc xoá ảnh. */
export function StallImage({ url, alt, onChange }: Props) {
  const { token } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, token));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <section className="card">
      <h3>Ảnh gian hàng</h3>
      <button
        type="button"
        className={`image-drop${drag ? ' drag' : ''}${url ? ' has' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void pick(e.dataTransfer.files[0]);
        }}
        disabled={busy}
      >
        {url ? (
          <img src={mediaUrl(url)} alt={alt} />
        ) : (
          <span>
            <b>{busy ? 'Đang tải ảnh…' : 'Bấm để chọn ảnh'}</b>
            <br />
            hoặc kéo thả file ảnh vào đây
          </span>
        )}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="row">
        <button className="btn" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'Đang tải…' : url ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </button>
        {url && (
          <button className="btn ghost-danger" onClick={() => onChange(undefined)} disabled={busy}>
            Xoá ảnh
          </button>
        )}
      </div>
      <p className="hint">Ảnh ngang (tỉ lệ 4:3) đẹp nhất. Ảnh lớn được thu nhỏ tự động trước khi lưu.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
