import { useState } from 'react';
import { festival, LANGS, pickLang, translate, tr, type Lang } from '@mtll/shared';
import { useSettings } from '../state/settings';

/**
 * UC01 Chọn ngôn ngữ: màn hình đầu tiên khi khách mở web khách.
 *
 * Màn hình đầu tiên: gợi ý sẵn ngôn ngữ của trình duyệt, khách chọn rồi bấm Tiếp tục.
 */
export function LanguagePage() {
  const { setLang } = useSettings();
  const [choice, setChoice] = useState<Lang>(() => pickLang(navigator.languages ?? [navigator.language]));

  return (
    <div className="lang-page">
      <div>
        <span className="eyebrow">{tr(festival.tagline, choice)}</span>
        <h1 className="hero">{tr(festival.name, choice)}</h1>
      </div>
      <h2>{translate(choice, 'app.chooseLanguage')}</h2>
      <div className="stack" role="radiogroup">
        {LANGS.map((l) => (
          <label key={l.code} className={l.code === choice ? 'option on' : 'option'}>
            <span>{l.label}</span>
            <input type="radio" name="lang" checked={l.code === choice} onChange={() => setChoice(l.code)} />
          </label>
        ))}
      </div>
      <p className="muted">{translate(choice, 'app.chooseLanguageHint')}</p>
      <button className="btn primary block" onClick={() => setLang(choice)}>
        {translate(choice, 'app.continue')}
      </button>
    </div>
  );
}
