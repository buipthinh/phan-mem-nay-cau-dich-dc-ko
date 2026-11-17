import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatTime, pointEditUrl, STATUS_LABEL, TARGETS, type Target } from '../lib/points';
import { listPoints, useStore, type Point, type TranslationStatus } from '../lib/store';
import { useBulkTranslate } from '../lib/useBulkTranslate';

type Tab = TranslationStatus | 'all';
const TABS: [Tab, string][] = [
  ['draft', 'Chờ duyệt'],
  ['outdated', 'Cần cập nhật'],
  ['missing', 'Chưa dịch'],
  ['approved', 'Đã duyệt'],
  ['all', 'Tất cả'],
];

interface Row {
  id: string;
  point: Point;
  lang: Target;
  status: TranslationStatus;
}

/**
 * UC13 Duyệt bản dịch: mọi bản dịch của mọi điểm thuyết minh (khu và gian hàng) trong một bảng,
 * chia tab theo trạng thái. Khách chỉ nghe / đọc được bản đã duyệt.
 */
export function TranslationsPage() {
  const { data, setTranslation } = useStore();
  const navigate = useNavigate();
  const bulk = useBulkTranslate();
  const [params, setParams] = useSearchParams();
  const pointKey = params.get('point') ?? '';
  const [tab, setTab] = useState<Tab>(pointKey ? 'all' : 'draft');
  const [lang, setLang] = useState<'all' | Target>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const all = useMemo<Row[]>(
    () =>
      listPoints(data)
        .filter((p) => !pointKey || p.key === pointKey)
        .flatMap((p) =>
          TARGETS.map((t) => ({
            id: `${p.key}|${t.code}`,
            point: p,
            lang: t.code,
            status: data.translation[p.key]?.[t.code] ?? 'missing',
          })),
        ),
    [data, pointKey],
  );
  const byLang = all.filter((r) => lang === 'all' || r.lang === lang);
  const rows = byLang.filter((r) => tab === 'all' || r.status === tab);
  const count = (t: Tab) => byLang.filter((r) => t === 'all' || r.status === t).length;
  const filterPoint = pointKey ? listPoints(data).find((p) => p.key === pointKey) : undefined;

  const chosen = rows.filter((r) => selected.has(r.id));
  const canApprove = (r: Row) => r.status === 'draft' || r.status === 'outdated';
  const allChecked = rows.length > 0 && chosen.length === rows.length;
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const changeTab = (t: Tab) => {
    setTab(t);
    setSelected(new Set());
  };

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">Khách chỉ thấy bản dịch đã duyệt</span>
        <h1>Duyệt bản dịch</h1>
        {filterPoint && (
          <p className="hint">
            Đang xem bản dịch của <b>{filterPoint.item.name.vi}</b>.{' '}
            <button className="link" onClick={() => setParams({})}>
              Xem tất cả điểm
            </button>
          </p>
        )}
      </header>

      <section className="card">
        <div className="row between wrap">
          <div className="tabs" role="tablist" aria-label="Trạng thái bản dịch">
            {TABS.map(([t, label]) => (
              <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => changeTab(t)}>
                {label} <span className="count">{count(t)}</span>
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="tr-lang">
            Ngôn ngữ
          </label>
          <select id="tr-lang" value={lang} onChange={(e) => setLang(e.target.value as 'all' | Target)}>
            <option value="all">Tất cả ngôn ngữ</option>
            {TARGETS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {chosen.length > 0 && (
          <div className="row bulk-bar">
            <span>Đã chọn {chosen.length} bản dịch</span>
            <button
              className="btn primary"
              disabled={!chosen.some(canApprove)}
              onClick={() => chosen.filter(canApprove).forEach((r) => setTranslation(r.point.key, r.lang, 'approved'))}
            >
              Duyệt các bản đã chọn
            </button>
            <button
              className="btn"
              disabled={bulk.busy}
              onClick={() => void bulk.run(chosen.map((r) => ({ point: r.point, lang: r.lang })))}
            >
              {bulk.progress ? `Đang dịch ${bulk.progress.done}/${bulk.progress.total}…` : 'Dịch lại bằng MyMemory'}
            </button>
          </div>
        )}
        {bulk.message && (
          <p className={bulk.message.error ? 'error' : 'hint ok-note'} role="status">
            {bulk.message.text}
          </p>
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
                    onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
                  />
                </th>
                <th>Điểm</th>
                <th>Ngôn ngữ</th>
                <th>Tiêu đề</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const open = `${pointEditUrl(r.point)}?lang=${r.lang}`;
                return (
                  <tr key={r.id} className="clickable" onClick={() => navigate(open)}>
                    <td className="check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label="Chọn" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td>
                      <span className="pt-name">{r.point.item.name.vi}</span>
                      <span className="pt-sub">
                        {r.point.type === 'zone' ? 'Khu' : 'Gian'} {r.point.item.id}
                      </span>
                    </td>
                    <td>{TARGETS.find((t) => t.code === r.lang)?.label}</td>
                    <td>{r.point.item.name[r.lang] || <span className="muted">—</span>}</td>
                    <td>
                      <span className={`badge st-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                    </td>
                    <td className="nowrap">{formatTime(data.updated?.[r.point.key])}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="actions">
                        <Link className="btn small" to={open}>
                          Xem
                        </Link>
                        {canApprove(r) && (
                          <button className="btn small primary" onClick={() => setTranslation(r.point.key, r.lang, 'approved')}>
                            Duyệt
                          </button>
                        )}
                        {r.status === 'missing' && (
                          <button
                            className="btn small"
                            disabled={bulk.busy}
                            onClick={() => void bulk.run([{ point: r.point, lang: r.lang }])}
                          >
                            Dịch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="hint empty">
                    Không có bản dịch nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="hint">
          Bấm vào một dòng để mở trang sửa điểm, đọc bản tiếng Việt cạnh bản dịch, sửa nếu cần rồi bấm Duyệt. Sửa bản tiếng Việt thì các bản
          đã dịch chuyển sang "Cần cập nhật".
        </p>
      </section>
    </div>
  );
}
