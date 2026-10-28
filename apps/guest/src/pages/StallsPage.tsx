import { Link } from 'react-router-dom';
import { ZONE_COLORS } from '@mtll/shared';
import { StallCode } from '../components/StallCode';
import { useContent } from '../state/content';
import { useSettings } from '../state/settings';

/**
 * UC05 Xem danh sách gian hàng, chia theo khu.
 */
export function StallsPage() {
  const { tl, t } = useSettings();
  const { zones, stalls } = useContent();
  const sections = zones.map((z) => ({ zone: z, items: stalls.filter((s) => s.zoneId === z.id) })).filter((s) => s.items.length > 0);

  return (
    <div className="stack">
      {sections.map(({ zone, items }) => (
        <section key={zone.id}>
          <div className="section-head" style={{ borderColor: ZONE_COLORS[zone.kind] }}>
            <h2>{tl(zone.name)}</h2>
            <span className="muted">{items.length}</span>
          </div>
          {items.map((s) => (
            <Link key={s.id} to={`/gian/${s.id}`} className="row-link">
              <StallCode id={s.id} color={ZONE_COLORS[zone.kind]} />
              <div className="grow">
                <strong>
                  {tl(s.name)}
                  {s.suggested && <span className="tag"> {t('stall.suggested')}</span>}
                </strong>
                <p className="muted clamp">{tl(s.description)}</p>
                <span className="price">{tl(s.price)}</span>
              </div>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}
