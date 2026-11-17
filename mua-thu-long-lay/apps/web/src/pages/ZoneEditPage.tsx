import { Link, useParams, useSearchParams } from 'react-router-dom';
import { speechLocale, type Lang, type Zone } from '@mtll/shared';
import { FestivalMap } from '../components/FestivalMap';
import { TranslationPanel } from '../components/TranslationPanel';
import { useScrollToTranslation } from '../lib/points';
import { useStore } from '../lib/store';

/** UC11: đọc thử thuyết minh bằng giọng của trình duyệt, giống cách web khách đọc cho khách nghe. */
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

/**
 * UC11 Sửa một điểm thuyết minh loại khu: tên, nội dung thuyết minh, toạ độ GPS và bán kính.
 * Mở từ trang Điểm thuyết minh.
 */
export function ZoneEditPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const openLang = useScrollToTranslation(params);
  const { data, updateZone, setTranslation } = useStore();
  const zone = data.zones.find((z) => z.id === id);
  if (!zone) {
    return (
      <div className="page">
        <p>Không tìm thấy khu {id}.</p>
        <Link to="/points">Quay lại danh sách điểm</Link>
      </div>
    );
  }
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
        <Link to="/points" className="hint">
          ← Điểm thuyết minh
        </Link>
        <h1>
          Khu {zone.id} · {zone.name.vi}
        </h1>
        <p className="hint">
          Khi khách đi vào vùng GPS của khu này, web khách tự đọc đoạn thuyết minh bằng ngôn ngữ khách chọn.
          {zone.published === false && ' Khu đang bị ẩn nên khách không thấy.'}
        </p>
      </header>

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
          <FestivalMap
            zones={data.zones}
            stalls={data.stalls.filter((s) => s.zoneId === zone.id)}
            editZoneId={zone.id}
            onMoveCenter={(center) => updateZone({ ...zone, center }, false)}
          />
          <label className="label" htmlFor="z-r-range">
            Bán kính vùng GPS: <b>{zone.radiusM} m</b>
          </label>
          <input
            id="z-r-range"
            className="range"
            type="range"
            min={10}
            max={200}
            step={5}
            value={zone.radiusM}
            onChange={(e) => updateZone({ ...zone, radiusM: Number(e.target.value) }, false)}
          />
          <p className="hint">Kéo chấm tròn hoặc bấm vào bản đồ để dời tâm khu. Kéo thanh trượt để đổi bán kính.</p>
        </section>
      </div>

      <TranslationPanel
        fields={[
          { key: 'name', label: 'Tên khu', value: zone.name },
          { key: 'narration', label: 'Thuyết minh', value: zone.narration, multiline: true },
        ]}
        statuses={data.translation[key] ?? {}}
        initialLang={openLang}
        onFieldsChange={setLang}
        onStatus={(lang, st) => setTranslation(key, lang, st)}
      />
    </div>
  );
}
