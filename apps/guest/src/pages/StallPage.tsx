import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { resolveText, ZONE_COLORS } from '@mtll/shared';
import { Icon } from '../components/Icon';
import { StallCode } from '../components/StallCode';
import { logVisit } from '../lib/api';
import { speak, stopSpeaking } from '../lib/narrator';
import { useContent } from '../state/content';
import { useLang, useSettings } from '../state/settings';

/**
 * UC05 Xem chi tiết gian hàng (mô tả, giá, chất gây dị ứng) và UC03 bấm nghe thuyết minh của gian.
 * Nếu khách vừa quét QR thì hiện thêm thông báo nhận tem (UC07).
 */
export function StallPage() {
  const { id = '' } = useParams();
  const stamp = (useLocation().state as { stamp?: 'new' | 'owned' } | null)?.stamp;
  const { t, tl, rate } = useSettings();
  const { getStall, getZone } = useContent();
  const lang = useLang();
  const stall = getStall(id);
  const zone = stall ? getZone(stall.zoneId) : undefined;
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!stall || !zone) {
    return (
      <div className="stack">
        <p>{t('stall.notFound')}</p>
        <Link className="btn" to="/quet">
          {t('map.scan')}
        </Link>
      </div>
    );
  }

  const description = resolveText(stall.description, lang);
  const listen = () => {
    setSpeaking(true);
    speak(`${tl(stall.name)}. ${description.text}`, description.lang, rate, () => setSpeaking(false));
    logVisit('play', { stallId: stall.id, zoneId: zone.id }, lang);
  };

  return (
    <div className="stack">
      <Link to="/gian" className="back">
        <Icon name="back" size={18} /> {t('tab.stalls')}
      </Link>
      {stamp && (
        <div className="stamp-note" role="status">
          {stamp === 'new' ? t('stall.stampEarned') : t('stall.stampOwned')}
        </div>
      )}
      <div className="stall-head">
        <StallCode id={stall.id} color={ZONE_COLORS[zone.kind]} size={56} />
        <div className="grow">
          <span className="chip" style={{ color: ZONE_COLORS[zone.kind], borderColor: ZONE_COLORS[zone.kind] }}>
            {tl(zone.name)}
          </span>
          <h1>{tl(stall.name)}</h1>
        </div>
      </div>
      <section className="card">
        <p>{description.text}</p>
        <div className="meta">
          <span className="muted">{t('stall.price')}</span>
          <strong>{tl(stall.price)}</strong>
        </div>
        {stall.allergens && (
          <div className="meta">
            <span className="muted">{t('stall.allergens')}</span>
            <strong>{tl(stall.allergens)}</strong>
          </div>
        )}
      </section>
      {speaking ? (
        <button
          className="btn block"
          onClick={() => {
            stopSpeaking();
            setSpeaking(false);
          }}
        >
          {t('map.stop')}
        </button>
      ) : (
        <button className="btn primary block" onClick={listen}>
          {t('map.listen')}
        </button>
      )}
    </div>
  );
}
