import { narrator, useNarrator } from '../lib/narrator';
import { useSettings } from '../state/settings';

const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

interface Props {
  /** Mã đoạn thuyết minh, vd. "stall:F1" hoặc "zone:A". */
  id: string;
  title: string;
  subtitle?: string;
  /** Ảnh nhỏ cạnh tên (ảnh gian hàng), giống bìa bài hát. */
  cover?: string;
  /** Mở đoạn này và đọc từ đầu (gọi khi thanh phát đang thuộc đoạn khác). */
  onStart: () => void;
}

/**
 * UC03 Thanh phát thuyết minh: phát / tạm dừng, kéo thanh để tua, nhảy câu trước / câu sau.
 * Thời gian là ước tính vì giọng đọc của trình duyệt không cho biết độ dài thật.
 */
export function NarrationPlayer({ id, title, subtitle, cover, onStart }: Props) {
  const { t } = useSettings();
  const s = useNarrator();
  const mine = s.id === id;
  const position = mine ? s.position : 0;
  const duration = mine ? s.duration : 0;
  const playing = mine && s.playing;

  return (
    <section className="player" aria-label={title}>
      <div className={cover ? 'player-title with-cover' : 'player-title'}>
        {cover && <img className={playing ? 'player-cover spin' : 'player-cover'} src={cover} alt="" />}
        <div>
          <strong>{title}</strong>
          {subtitle && <span>{subtitle}</span>}
        </div>
      </div>
      <input
        type="range"
        className="player-bar"
        min={0}
        max={Math.max(1, duration)}
        step={0.1}
        value={position}
        disabled={!mine}
        aria-label={t('player.seek')}
        style={{ ['--p' as string]: `${duration ? (position / duration) * 100 : 0}%` }}
        onChange={(e) => narrator.seek(Number(e.target.value))}
      />
      <div className="player-time">
        <span>{fmt(position)}</span>
        <span>{mine ? `~${fmt(duration)}` : '--:--'}</span>
      </div>
      <div className="player-buttons">
        <button className="player-btn" aria-label={t('player.prev')} disabled={!mine} onClick={() => narrator.skip(-1)}>
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path d="M6 5v14M19 5 9 12l10 7V5Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="player-btn main"
          aria-label={playing ? t('player.pause') : t('map.listen')}
          onClick={() => (playing ? narrator.pause() : mine ? narrator.resume() : onStart())}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
              <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
              <path d="M8 5v14l11-7L8 5Z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button className="player-btn" aria-label={t('player.next')} disabled={!mine} onClick={() => narrator.skip(1)}>
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path d="M18 5v14M5 5l10 7-10 7V5Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
