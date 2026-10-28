import { canRedeem, progress, ZONE_COLORS } from '@mtll/shared';
import { StallCode } from '../components/StallCode';
import { useContent } from '../state/content';
import { useSettings } from '../state/settings';

/**
 * UC07 Săn tem đổi quà: thẻ tem của khách, đủ số tem thì đưa màn hình cho nhân viên để nhận quà.
 */
export function StampsPage() {
  const { t, tl, stamps, clearStamps } = useSettings();
  const { stampsForGift: goal, getStall, getZone } = useContent();
  const done = canRedeem(stamps, goal);

  return (
    <div className="stack">
      <h1>{t('stamps.title')}</h1>
      <p className="muted">{t('stamps.howTo')}</p>
      <section className="card">
        <h2>{t('stamps.progress', { count: Math.min(stamps.length, goal), goal })}</h2>
        <div className="track">
          <div className="fill" style={{ width: `${progress(stamps, goal) * 100}%` }} />
        </div>
        <div className="slots">
          {Array.from({ length: goal }, (_, i) => {
            const id = stamps[i];
            const zone = id ? getZone(getStall(id)?.zoneId ?? '') : undefined;
            return id && zone ? <StallCode key={i} id={id} color={ZONE_COLORS[zone.kind]} /> : <span key={i} className="slot" />;
          })}
        </div>
      </section>
      {done && <div className="stamp-note">{t('stamps.ready')}</div>}
      {stamps.map((id) => {
        const s = getStall(id);
        return s ? (
          <p key={id}>
            {id} · {tl(s.name)}
          </p>
        ) : null;
      })}
      {stamps.length > 0 && (
        <button className="btn" onClick={clearStamps}>
          {t('stamps.reset')}
        </button>
      )}
    </div>
  );
}
