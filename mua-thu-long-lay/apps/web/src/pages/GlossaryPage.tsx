import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { deleteTerm, listTerms, saveTerm, type GlossaryTerm } from '../lib/glossary';
import { formatTime, TARGETS } from '../lib/points';

const EMPTY: GlossaryTerm = { id: 0, term_vi: '', note: '', translations: {} };

/**
 * UC13 Thuật ngữ: những từ phải dịch thống nhất (tên lễ hội, món đặc sản...).
 * Khi bấm dịch tự động, API thay các từ này bằng bản dịch trong bảng trước khi gửi sang MyMemory.
 */
export function GlossaryPage() {
  const { token } = useAuth();
  const [terms, setTerms] = useState<GlossaryTerm[] | null>(null);
  const [editing, setEditing] = useState<GlossaryTerm | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setTerms(await listTerms(token));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token]);
  useEffect(() => {
    const timer = setTimeout(reload, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (terms ?? []).filter(
      (t) => !q || t.term_vi.toLowerCase().includes(q) || Object.values(t.translations).some((v) => v?.toLowerCase().includes(q)),
    );
  }, [terms, query]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.term_vi.trim()) {
      setError('Chưa nhập thuật ngữ tiếng Việt');
      return;
    }
    setError(null);
    try {
      await saveTerm(token, editing);
      setEditing(null);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(t: GlossaryTerm) {
    if (!window.confirm(`Xoá thuật ngữ "${t.term_vi}"?`)) return;
    try {
      await deleteTerm(token, t.id);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page">
      <header className="page-head row between">
        <div>
          <span className="eyebrow">{terms ? `${terms.length} thuật ngữ` : 'Đang tải...'}</span>
          <h1>Thuật ngữ</h1>
          <p className="hint">
            Từ trong bảng này luôn được dịch đúng như đã ghi khi bấm dịch tự động bằng MyMemory. Chỉ thay khi khớp nguyên từ, không phân
            biệt chữ hoa.
          </p>
        </div>
        <button className="btn primary" onClick={() => setEditing({ ...EMPTY, translations: {} })}>
          + Thêm thuật ngữ
        </button>
      </header>

      {editing && (
        <form className="card form glossary-form" onSubmit={submit}>
          <h3>{editing.id ? `Sửa "${editing.term_vi}"` : 'Thuật ngữ mới'}</h3>
          <div className="grid-3">
            <div>
              <label className="label" htmlFor="g-vi">
                Tiếng Việt
              </label>
              <input
                id="g-vi"
                value={editing.term_vi}
                maxLength={100}
                onChange={(e) => setEditing({ ...editing, term_vi: e.target.value })}
              />
            </div>
            {TARGETS.map((t) => (
              <div key={t.code}>
                <label className="label" htmlFor={`g-${t.code}`}>
                  {t.label}
                </label>
                <input
                  id={`g-${t.code}`}
                  value={editing.translations[t.code] ?? ''}
                  maxLength={200}
                  onChange={(e) => setEditing({ ...editing, translations: { ...editing.translations, [t.code]: e.target.value } })}
                />
              </div>
            ))}
          </div>
          <label className="label" htmlFor="g-note">
            Ghi chú
          </label>
          <input
            id="g-note"
            value={editing.note ?? ''}
            maxLength={200}
            onChange={(e) => setEditing({ ...editing, note: e.target.value })}
          />
          <p className="hint">Ngôn ngữ nào để trống thì MyMemory tự dịch từ đó như bình thường.</p>
          <div className="row">
            <button className="btn primary" type="submit">
              Lưu
            </button>
            <button className="btn" type="button" onClick={() => setEditing(null)}>
              Huỷ
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section className="card">
        <div className="row filters">
          <label className="sr-only" htmlFor="g-search">
            Tìm thuật ngữ
          </label>
          <input id="g-search" placeholder="Tìm thuật ngữ..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table className="points">
            <thead>
              <tr>
                <th>Thuật ngữ tiếng Việt</th>
                <th>Dịch cố định</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="term-cell">
                    <span className="pt-name">{t.term_vi}</span>
                    {t.note && <span className="pt-sub">{t.note}</span>}
                  </td>
                  <td>
                    <div className="term-chips">
                      {TARGETS.map((l) => (
                        <span key={l.code} className={t.translations[l.code] ? 'term-chip' : 'term-chip empty'} title={l.label}>
                          <b>{l.code.toUpperCase()}</b>
                          {t.translations[l.code] || 'MyMemory tự dịch'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="nowrap">{formatTime(t.updated_at)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn small" onClick={() => setEditing({ ...t, translations: { ...t.translations } })}>
                        Sửa
                      </button>
                      <button className="btn small ghost-danger" onClick={() => void remove(t)}>
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {terms && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="hint empty">
                    Chưa có thuật ngữ nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
