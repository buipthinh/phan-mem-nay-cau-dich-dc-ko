import { useState } from 'react';
import { speechLocale, ZONE_COLORS, type Lang, type Zone } from '@mtll/shared';
import { FestivalMap } from '../components/FestivalMap';
import { TranslationPanel } from '../components/TranslationPanel';
import { useStore } from '../lib/store';

/** Đọc thử bằng giọng TTS của trình duyệt. App mobile dùng expo-speech với cùng nội dung. */
function preview(text: string, lang: Lang) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLocale(lang);
    speechSynthesis.speak(u);
  } catch {
    /* trình duyệt không hỗ trợ đọc */
  }
}

export function ZonesPage() {
  const { data, updateZone, setTranslation } = useStore();
  const [selected, setSelected] = useState('E');
  const zone = data.zones.find((z) => z.id === selected) ?? data.zones[0];
  const key = `zone:${zone.id}`;

  const setLang = (lang: Exclude<Lang, 'vi'>, changes: Record<string, string>) => {
    const next = { ...zone };
    for (const [field, text] of Object.entries(changes)) {
      const f = field as 'name' | 'narration';
      next[f] = { ...zone[f], [lang]: text };
    }
    updateZone(next as Zone, false);
  };

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">Thuyết minh tự động theo vùng GPS</span>
        <h1>Khu và thuyết minh</h1>
        <p className="hint">Khi khách đi vào vùng GPS của một khu, app tự đọc đoạn thuyết minh của khu đó bằng ngôn ngữ khách chọn.</p>
      </header>

      <div className="zone-tabs" role="tablist">
        {data.zones.map((z) => (
          <button
            key={z.id}
            role="tab"
            aria-selected={z.id === zone.id}
            className={z.id === zone.id ? 'on' : ''}
            style={{ ['--c' as string]: ZONE_COLORS[z.kind] }}
            onClick={() => setSelected(z.id)}
          >
            <b>{z.id}</b> {z.name.vi}
          </button>
        ))}
      </div>

      <div className="grid-2 wide-left">
        <section className="card form">
          <label className="label" htmlFor="z-name">
            Tên khu
          </label>
          <input
            id="z-name"
            value={zone.name.vi}
            onChange={(e) => updateZone({ ...zone, name: { ...zone.name, vi: e.target.value } }, true)}
          />
          <label className="label" htmlFor="z-narr">
            Nội dung thuyết minh (tiếng Việt)
          </label>
          <textarea
            id="z-narr"
            rows={6}
            value={zone.narration.vi}
            onChange={(e) => updateZone({ ...zone, narration: { ...zone.narration, vi: e.target.value } }, true)}
          />
          <div className="grid-3">
            <div>
              <label className="label" htmlFor="z-lat">
                Vĩ độ tâm
              </label>
              <input
                id="z-lat"
                type="number"
                step="0.00001"
                value={zone.center.lat}
                onChange={(e) => updateZone({ ...zone, center: { ...zone.center, lat: Number(e.target.value) } }, false)}
              />
            </div>
            <div>
              <label className="label" htmlFor="z-lng">
                Kinh độ tâm
              </label>
              <input
                id="z-lng"
                type="number"
                step="0.00001"
                value={zone.center.lng}
                onChange={(e) => updateZone({ ...zone, center: { ...zone.center, lng: Number(e.target.value) } }, false)}
              />
            </div>
            <div>
              <label className="label" htmlFor="z-r">
                Bán kính (m)
              </label>
              <input
                id="z-r"
                type="number"
                min={10}
                max={200}
                value={zone.radiusM}
                onChange={(e) => updateZone({ ...zone, radiusM: Number(e.target.value) }, false)}
              />
            </div>
          </div>
          <div className="row">
            <button className="btn" onClick={() => preview(zone.narration.vi, 'vi')}>
              Nghe thử tiếng Việt
            </button>
            {zone.narration.en && (
              <button className="btn" onClick={() => preview(zone.narration.en!, 'en')}>
                Nghe thử tiếng Anh
              </button>
            )}
          </div>
        </section>
        <section className="card">
          <FestivalMap zones={data.zones} stalls={data.stalls.filter((s) => s.zoneId === zone.id)} />
        </section>
      </div>

      <TranslationPanel
        fields={[
          { key: 'name', label: 'Tên khu', value: zone.name },
          { key: 'narration', label: 'Thuyết minh', value: zone.narration, multiline: true },
        ]}
        statuses={data.translation[key] ?? {}}
        onFieldsChange={setLang}
        onStatus={(lang, st) => setTranslation(key, lang, st)}
      />
    </div>
  );
}
