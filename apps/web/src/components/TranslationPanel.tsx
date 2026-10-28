import { useState } from 'react';
import { LANGS, type Lang, type Localized } from '@mtll/shared';
import { isDemoTranslator, translateText } from '../lib/translator';
import type { TranslationStatus } from '../lib/store';

type Target = Exclude<Lang, 'vi'>;

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
}

const STATUS_LABEL: Record<TranslationStatus, string> = {
  missing: 'Chưa dịch',
  draft: 'Bản nháp',
  approved: 'Đã duyệt',
  outdated: 'Cần dịch lại',
};

const TARGETS = LANGS.filter((l): l is (typeof LANGS)[number] & { code: Target } => l.code !== 'vi');

/**
 * UC13 Dịch tự động và duyệt: bấm dịch máy, sửa bản dịch, rồi duyệt để khách nhìn thấy.
 *
 * Khung dịch: xem bản gốc tiếng Việt cạnh bản dịch, bấm dịch tự động, sửa tay rồi duyệt.
 */
export function TranslationPanel({ fields, statuses, onFieldsChange, onStatus }: Props) {
  const [lang, setLang] = useState<Target>('en');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = statuses[lang] ?? 'missing';

  async function autoTranslate() {
    setBusy(true);
    setError(null);
    try {
      const changes: Record<string, string> = {};
      for (const f of fields) changes[f.key] = (await translateText(f.value.vi, lang)).text;
      onFieldsChange(lang, changes);
      onStatus(lang, 'draft');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không dịch được. Thử lại sau.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card translation">
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
            {busy ? 'Đang dịch…' : 'Dịch tự động từ tiếng Việt'}
          </button>
          <button
            className="btn primary"
            onClick={() => onStatus(lang, 'approved')}
            disabled={status === 'approved' || status === 'missing'}
          >
            Duyệt bản dịch
          </button>
        </div>
      </div>
      {isDemoTranslator && (
        <p className="hint">
          Chế độ demo: chưa nối dịch vụ dịch máy nên bản dịch tự động chỉ là bản nháp mẫu. Đặt VITE_TRANSLATE_URL để dùng dịch thật.
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
