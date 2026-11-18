import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { stallQrValue, type Stall } from '@mtll/shared';
import { mediaUrl } from '../lib/api';
import { useGuestUrl } from '../lib/guestUrl';
import {
  approvedCount,
  formatTime,
  isPublished,
  kindLabel,
  pointEditUrl,
  pointSubtitle,
  pointType,
  POINT_TYPES,
  TARGETS,
  type PointType,
} from '../lib/points';
import { listPoints, useStore, type Point } from '../lib/store';
import { useBulkTranslate } from '../lib/useBulkTranslate';

type StatusFilter = 'all' | 'published' | 'hidden';
interface Filter {
  q: string;
  type: 'all' | PointType;
  status: StatusFilter;
}

/** Biểu tượng nhỏ cho nút thao tác (vẽ bằng SVG để không cần thư viện icon). */
function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}
const ICONS = {
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  translate: 'M4 5h8M8 3v2m2.5 0C9.5 9 7 12 4 14m2-5c1.5 2 3.5 3.5 6 4.5M13 21l4-9 4 9m-6.8-3h5.6',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4',
  hide: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2.5 12s3.5 7 9.5 7a9.9 9.9 0 0 0 5.4-1.6',
  show: 'M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6',
};

/**
 * UC11, UC12 Điểm thuyết minh: gộp khu (thuyết minh theo GPS) và gian hàng (thuyết minh khi quét QR) vào một bảng.
 * Lọc, ẩn / hiện, xoá, xem QR, dịch tự động hàng loạt bằng MyMemory.
 */
export function PointsPage() {
  const { data, removeStall, setPublished } = useStore();
  const bulk = useBulkTranslate();
  const points = useMemo(() => listPoints(data), [data]);

  // Bộ lọc chỉ áp dụng khi bấm "Lọc", giống trang mẫu.
  const [draft, setDraft] = useState<Filter>({ q: '', type: 'all', status: 'all' });
  const [filter, setFilter] = useState<Filter>(draft);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qrStall, setQrStall] = useState<Stall | null>(null);

  const rows = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return points.filter(
      (p) =>
        (filter.type === 'all' || pointType(p) === filter.type) &&
        (filter.status === 'all' || (filter.status === 'published') === isPublished(p)) &&
        (!q || p.item.name.vi.toLowerCase().includes(q) || p.item.id.toLowerCase() === q),
    );
  }, [points, filter]);

  const chosen = rows.filter((p) => selected.has(p.key));
  const allChecked = rows.length > 0 && chosen.length === rows.length;
  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** Dịch mọi ngôn ngữ còn thiếu hoặc cần cập nhật của các điểm (chọn hoặc tất cả). */
  function translateMissing(list: Point[]) {
    const jobs = list.flatMap((p) =>
      TARGETS.filter((t) => {
        const st = data.translation[p.key]?.[t.code] ?? 'missing';
        return st === 'missing' || st === 'outdated';
      }).map((t) => ({ point: p, lang: t.code })),
    );
    void bulk.run(jobs);
  }

  function remove(p: Point) {
    if (p.type !== 'stall') return;
    if (window.confirm(`Xoá gian ${p.item.id} · ${p.item.name.vi}? Mã QR đã in sẽ không dùng được nữa.`)) removeStall(p.item.id);
  }

  return (
    <div className="page">
      <header className="page-head row between">
        <div>
          <span className="eyebrow">
            {data.zones.length} khu · {data.stalls.length} gian hàng
          </span>
          <h1>Điểm thuyết minh</h1>
        </div>
        <div className="row">
          <button className="btn" onClick={() => translateMissing(points)} disabled={bulk.busy}>
            {bulk.progress ? `Đang dịch ${bulk.progress.done}/${bulk.progress.total}…` : 'Dịch tất cả điểm'}
          </button>
          <Link className="btn primary" to="/stalls/new">
            + Thêm điểm
          </Link>
        </div>
      </header>

      {bulk.message && (
        <p className={bulk.message.error ? 'error' : 'hint ok-note'} role="status">
          {bulk.message.text}
        </p>
      )}

      <section className="card">
        <form
          className="row filters"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setFilter(draft);
            setSelected(new Set());
          }}
        >
          <label className="sr-only" htmlFor="pt-search">
            Tìm theo tên điểm
          </label>
          <input
            id="pt-search"
            placeholder="Tìm theo tên điểm..."
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          />
          <label className="sr-only" htmlFor="pt-type">
            Loại điểm
          </label>
          <select id="pt-type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Filter['type'] })}>
            <option value="all">Tất cả loại</option>
            {POINT_TYPES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="pt-status">
            Trạng thái
          </label>
          <select id="pt-status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as StatusFilter })}>
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đang dùng</option>
            <option value="hidden">Đã ẩn</option>
          </select>
          <button className="btn" type="submit">
            Lọc
          </button>
        </form>

        {chosen.length > 0 && (
          <div className="row bulk-bar">
            <span>Đã chọn {chosen.length} điểm</span>
            <button className="btn" disabled={bulk.busy} onClick={() => translateMissing(chosen)}>
              Dịch các điểm đã chọn
            </button>
            <button className="btn" onClick={() => chosen.forEach((p) => setPublished(p.key, true))}>
              Xuất bản
            </button>
            <button className="btn" onClick={() => chosen.forEach((p) => setPublished(p.key, false))}>
              Ẩn
            </button>
          </div>
        )}

        <div className="table-wrap">
          <table className="points">
            <thead>
              <tr>
                <th className="check">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả"
                    checked={allChecked}
                    onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((p) => p.key)))}
                  />
                </th>
                <th>Tên điểm</th>
                <th>Loại</th>
                <th>Bản dịch</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const n = approvedCount(data, p.key);
                const shown = isPublished(p);
                return (
                  <tr key={p.key}>
                    <td className="check">
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${p.item.name.vi}`}
                        checked={selected.has(p.key)}
                        onChange={() => toggle(p.key)}
                      />
                    </td>
                    <td>
                      <div className="pt-cell">
                        {p.type === 'stall' && p.item.imageUrl && <img className="pt-thumb" src={mediaUrl(p.item.imageUrl)} alt="" />}
                        <div>
                          <Link to={pointEditUrl(p)} className="pt-name">
                            {p.item.name.vi}
                          </Link>
                          <span className="pt-sub">{pointSubtitle(p, data)}</span>
                        </div>
                      </div>
                    </td>
                    <td>{kindLabel(p)}</td>
                    <td>
                      <Link
                        to={`/translations?point=${p.key}`}
                        className={`badge ${n === TARGETS.length ? 'st-approved' : n ? 'st-draft' : 'st-missing'}`}
                      >
                        {n}/{TARGETS.length} duyệt
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${shown ? 'st-approved' : 'st-missing'}`}>{shown ? 'Đã xuất bản' : 'Đã ẩn'}</span>
                    </td>
                    <td className="nowrap">{formatTime(data.updated?.[p.key])}</td>
                    <td>
                      <div className="actions">
                        <Link className="icon-btn" to={pointEditUrl(p)} title="Sửa" aria-label="Sửa">
                          <Icon d={ICONS.edit} />
                        </Link>
                        <Link className="icon-btn" to={`/translations?point=${p.key}`} title="Bản dịch" aria-label="Bản dịch">
                          <Icon d={ICONS.translate} />
                        </Link>
                        <button
                          className="icon-btn"
                          title={p.type === 'stall' ? 'Mã QR' : 'Khu thuyết minh theo GPS, không có mã QR'}
                          aria-label="Mã QR"
                          disabled={p.type !== 'stall'}
                          onClick={() => p.type === 'stall' && setQrStall(p.item)}
                        >
                          <Icon d={ICONS.qr} />
                        </button>
                        <button
                          className="icon-btn"
                          title={shown ? 'Ẩn với khách' : 'Xuất bản lại'}
                          aria-label={shown ? 'Ẩn' : 'Xuất bản'}
                          onClick={() => setPublished(p.key, !shown)}
                        >
                          <Icon d={shown ? ICONS.hide : ICONS.show} />
                        </button>
                        <button
                          className="icon-btn danger"
                          title={p.type === 'stall' ? 'Xoá' : 'Khu cố định trên bản đồ, chỉ ẩn được'}
                          aria-label="Xoá"
                          disabled={p.type !== 'stall'}
                          onClick={() => remove(p)}
                        >
                          <Icon d={ICONS.trash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="hint">
                    Không có điểm nào khớp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="hint">
          Khu được đọc tự động khi khách đi vào vùng GPS. Gian hàng được đọc khi khách quét mã QR ở gian. Điểm "Đã ẩn" không hiện trên web
          khách.
        </p>
      </section>

      {qrStall && <QrDialog stall={qrStall} onClose={() => setQrStall(null)} />}
    </div>
  );
}

/** Hộp xem mã QR của một gian. Khách quét bằng ứng dụng Camera của điện thoại là mở đúng gian. */
function QrDialog({ stall, onClose }: { stall: Stall; onClose: () => void }) {
  const [guestUrl] = useGuestUrl();
  const value = stallQrValue(stall.id, guestUrl);
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 240 }).then(setSrc, () => setSrc(''));
  }, [value]);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card modal qr-card" role="dialog" aria-label={`Mã QR gian ${stall.id}`} onClick={(e) => e.stopPropagation()}>
        <h3>
          {stall.id} · {stall.name.vi}
        </h3>
        {src && <img src={src} alt={`Mã QR của gian ${stall.id}`} width={220} height={220} />}
        <code>{value}</code>
        <div className="row">
          <Link className="btn" to="/qr">
            In mã QR
          </Link>
          <button className="btn primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
