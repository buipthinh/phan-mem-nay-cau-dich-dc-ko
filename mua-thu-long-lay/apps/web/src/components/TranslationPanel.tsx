import { useState } from 'react';
import type { Lang, Localized } from '@mtll/shared';
import { useAuth } from '../lib/auth';
import { STATUS_LABEL, TARGETS, type Target } from '../lib/points';
import type { TranslationStatus } from '../lib/store';
import { translateText } from '../lib/translator';

export interface TranslatableField {
  key: string;
  label: string;
  value: Localized;
  multiline?: boolean;
}

interface Props {
  fields: TranslatableField[];
  statuses: Partial<Record<Lang, TranslationStatus>>;
  /** Đổi một hoặc nhiều trường của cùng một ngôn ngữ trong một lần cập nhật. */
  onFieldsChange: (lang: Target, changes: Record<string, string>) => void;
  onStatus: (lang: Target, status: TranslationStatus) => void;
  /** Ngôn ngữ mở sẵn (vd. bấm từ trang Duyệt bản dịch). */
  initialLang?: Target;
}

/**
 * UC13 Dịch tự động và duyệt: bấm dịch máy, sửa bản dịch, rồi duyệt để khách nhìn thấy.
 *
 * Khung dịch: xem bản gốc tiếng Việt cạnh bản dịch, bấm dịch tự động, sửa tay rồi duyệt.
 */
export function TranslationPanel({ fields, statuses, onFieldsChange, onStatus, initialLang = 'en' }: Props) {
  const { token } = useAuth();
  const [lang, setLang] = useState<Target>(initialLang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = statuses[lang] ?? 'missing';

  async function autoTranslate() {
    setBusy(true);
    setError(null);
    try {
      const changes: Record<string, string> = {};
      for (const f of fields) changes[f.key] = (await translateText(f.value.vi, lang, token)).text;
      onFieldsChange(lang, changes);
      onStatus(lang, 'draft');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không dịch được. Thử lại sau.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card translation" id="ban-dich">
      <header className="row between">
        <h3>Bản dịch</h3>
        <div className="seg" role="tablist" aria-label="Ngôn ngữ đích">
          {TARGETS.map((l) => (
            <button
              key={l.code}
              role="tab"
              aria-selected={lang === l.code}
              className={lang === l.code ? 'on' : ''}
              onClick={() => setLang(l.code)}
            >
              {l.label}
              <span className={`dot st-${statuses[l.code] ?? 'missing'}`} aria-hidden />
            </button>
          ))}
        </div>
      </header>

      <div className="row between">
        <span className={`badge st-${status}`}>{STATUS_LABEL[status]}</span>
        <div className="row">
          <button className="btn" onClick={autoTranslate} disabled={busy}>
            {busy ? 'Đang dịch…' : 'Dịch tự động (MyMemory)'}
          </button>
          <button className="btn" onClick={() => onStatus(lang, 'approved')} disabled={status === 'approved' || status === 'missing'}>
            Duyệt bản dịch
          </button>
          <button
            className="btn primary"
            onClick={() =>
              TARGETS.forEach((t) => (statuses[t.code] === 'draft' || statuses[t.code] === 'outdated') && onStatus(t.code, 'approved'))
            }
            disabled={!TARGETS.some((t) => statuses[t.code] === 'draft' || statuses[t.code] === 'outdated')}
          >
            Duyệt tất cả ngôn ngữ
          </button>
        </div>
      </div>
      {token ? (
        <p className="hint">Dịch máy bằng MyMemory, các từ trong trang Thuật ngữ luôn được dịch đúng như bảng. Đọc lại rồi bấm Duyệt.</p>
      ) : (
        <p className="hint">
          Chế độ demo (không có SQL Server): bản dịch tự động chỉ là bản nháp mẫu. Chạy API để dịch thật bằng MyMemory.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="pairs">
        {fields.map((f) => {
          const id = `tr-${f.key}-${lang}`;
          return (
            <div className="pair" key={f.key}>
              <div>
                <span className="label">{f.label} · Tiếng Việt (gốc)</span>
                <p className="source">{f.value.vi}</p>
              </div>
              <div>
                <label className="label" htmlFor={id}>
                  {f.label} · {TARGETS.find((t) => t.code === lang)?.label}
                </label>
                {f.multiline ? (
                  <textarea
                    id={id}
                    rows={4}
                    value={f.value[lang] ?? ''}
                    onChange={(e) => {
                      onFieldsChange(lang, { [f.key]: e.target.value });
                      if (status === 'approved') onStatus(lang, 'draft');
                    }}
                  />
                ) : (
                  <input
                    id={id}
                    value={f.value[lang] ?? ''}
                    onChange={(e) => {
                      onFieldsChange(lang, { [f.key]: e.target.value });
                      if (status === 'approved') onStatus(lang, 'draft');
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
