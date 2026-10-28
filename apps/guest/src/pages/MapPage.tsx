import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LANGS, resolveText, ZONE_COLORS, type Zone } from '@mtll/shared';
import { FestivalMap } from '../components/FestivalMap';
import { logVisit } from '../lib/api';
import { speak, stopSpeaking } from '../lib/narrator';
import { useZoneTracking } from '../lib/useZoneTracking';
import { useLang, useSettings } from '../state/settings';

/**
 * UC02 Xem bản đồ lễ hội + UC03 Nghe thuyết minh tự động.
 * Bản đồ vẽ các khu và gian; khi GPS báo khách vào khu mới thì tự đọc thuyết minh của khu đó.
 */
export function MapPage() {
  const navigate = useNavigate();
  const { t, tl, autoNarrate, rate } = useSettings();
  const lang = useLang();
  const [speaking, setSpeaking] = useState(false);

  const narrate = useCallback(
    (zone: Zone) => {
      setSpeaking(true);
      speak(`${tl(zone.name)}. ${tl(zone.narration)}`, resolveText(zone.narration, lang).lang, rate, () => setSpeaking(false));
      logVisit('play', { zoneId: zone.id }, lang);
    },
    [lang, rate, tl],
  );

  const onEnter = useCallback(
    (zone: Zone) => {
      logVisit('zone_enter', { zoneId: zone.id }, lang);
      if (autoNarrate) narrate(zone);
    },
    [autoNarrate, narrate, lang],
  );

  const { zone, gps, simulate } = useZoneTracking(onEnter);
  useEffect(() => () => stopSpeaking(), []);

  const narration = zone ? resolveText(zone.narration, lang) : null;
  const fallbackLabel = narration?.isFallback ? LANGS.find((l) => l.code === narration.lang)?.label : null;

  return (
    <div className="stack">
      <div className="card tight">
        <FestivalMap lang={lang} activeZone={zone?.id} onZonePress={simulate} onStallPress={(id) => navigate(`/gian/${id}`)} />
      </div>
      <p className="gps">
        <span className={gps === 'on' ? 'dot on' : 'dot'} />
        {gps === 'on' ? t('map.gpsOn') : t('map.gpsOff')}
      </p>
      <section className="card">
        {zone ? (
          <>
            <span className="chip" style={{ color: ZONE_COLORS[zone.kind], borderColor: ZONE_COLORS[zone.kind] }}>
              {t('map.youAreIn')} · {zone.id}
            </span>
            <h2>{tl(zone.name)}</h2>
            <p>{narration?.text}</p>
            {fallbackLabel && <p className="muted">{t('map.fallbackNotice', { lang: fallbackLabel })}</p>}
            {speaking ? (
              <button
                className="btn"
                onClick={() => {
                  stopSpeaking();
                  setSpeaking(false);
                }}
              >
                {t('map.stop')}
              </button>
            ) : (
              <button className="btn primary" onClick={() => narrate(zone)}>
                {t('map.listen')}
              </button>
            )}
          </>
        ) : (
          <>
            <h2>{t('map.outside')}</h2>
            <p className="muted">{t('map.outsideHint')}</p>
          </>
        )}
      </section>
      <Link className="btn primary block" to="/quet">
        {t('map.scan')}
      </Link>
      <p className="muted">{t('map.demoHint')}</p>
    </div>
  );
}
