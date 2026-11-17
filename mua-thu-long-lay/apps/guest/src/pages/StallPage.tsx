import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { resolveText, ZONE_COLORS } from '@mtll/shared';
import { Icon } from '../components/Icon';
import { NarrationPlayer } from '../components/NarrationPlayer';
import { StallCode } from '../components/StallCode';
import { logVisit, mediaUrl } from '../lib/api';
import { narrator, stopSpeaking } from '../lib/narrator';
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
  const [zoom, setZoom] = useState(false);

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
    narrator.play(`stall:${stall.id}`, tl(stall.name), `${tl(stall.name)}. ${description.text}`, description.lang, rate);
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
      {stall.imageUrl ? (
        // Có ảnh: ảnh lớn đầu trang, tên gian nằm trên ảnh. Chạm ảnh để xem toàn màn hình.
        <button className="stall-hero" onClick={() => setZoom(true)} aria-label={tl(stall.name)}>
          <img src={mediaUrl(stall.imageUrl)} alt="" />
          <span className="hero-code" style={{ background: ZONE_COLORS[zone.kind] }}>
            {stall.id}
          </span>
          <span className="hero-text">
            <span className="hero-zone">{tl(zone.name)}</span>
            <span className="hero-title">{tl(stall.name)}</span>
          </span>
        </button>
      ) : (
        <div className="stall-head">
          <StallCode id={stall.id} color={ZONE_COLORS[zone.kind]} size={56} />
          <div className="grow">
            <span className="chip" style={{ color: ZONE_COLORS[zone.kind], borderColor: ZONE_COLORS[zone.kind] }}>
              {tl(zone.name)}
            </span>
            <h1>{tl(stall.name)}</h1>
          </div>
        </div>
      )}
      {zoom && stall.imageUrl && (
        <button className="lightbox" onClick={() => setZoom(false)} aria-label="✕">
          <img src={mediaUrl(stall.imageUrl)} alt={tl(stall.name)} />
        </button>
      )}
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
      <NarrationPlayer
        id={`stall:${stall.id}`}
        title={tl(stall.name)}
        subtitle={tl(zone.name)}
        cover={stall.imageUrl && mediaUrl(stall.imageUrl)}
        onStart={listen}
      />
    </div>
  );
}
