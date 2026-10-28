import { LANGS } from '@mtll/shared';
import { stopSpeaking } from '../lib/narrator';
import { useContent } from '../state/content';
import { useLang, useSettings } from '../state/settings';

const RATES = [0.75, 1, 1.25, 1.5];

/**
 * UC08 Cài đặt: đổi ngôn ngữ (UC01), bật/tắt tự đọc thuyết minh, chọn tốc độ đọc.
 */
export function SettingsPage() {
  const { t, tl, setLang, autoNarrate, setAutoNarrate, rate, setRate } = useSettings();
  const content = useContent();
  const lang = useLang();

  return (
    <div className="stack">
      <h1>{t('tab.settings')}</h1>
      <section className="card">
        <span className="eyebrow">{t('settings.language')}</span>
        <div className="pills">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={l.code === lang ? 'pill on' : 'pill'}
              aria-pressed={l.code === lang}
              onClick={() => {
                stopSpeaking();
                setLang(l.code);
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <label className="row between">
          <span>{t('settings.autoNarrate')}</span>
          <input type="checkbox" className="switch" checked={autoNarrate} onChange={(e) => setAutoNarrate(e.target.checked)} />
        </label>
        <span className="eyebrow">{t('settings.rate')}</span>
        <div className="pills">
          {RATES.map((r) => (
            <button key={r} className={r === rate ? 'pill on' : 'pill'} aria-pressed={r === rate} onClick={() => setRate(r)}>
              {r}×
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <span className="eyebrow">{t('settings.about')}</span>
        <h2>{tl(content.name)}</h2>
        <p className="muted">{tl(content.location)}</p>
        <p className="muted">
          {content.days[0]} → {content.days[content.days.length - 1]} · {content.opens} – {content.closes}
        </p>
        <p className="muted small">{content.source === 'db' ? 'SQL Server ✓' : 'Offline'}</p>
      </section>
    </div>
  );
}
