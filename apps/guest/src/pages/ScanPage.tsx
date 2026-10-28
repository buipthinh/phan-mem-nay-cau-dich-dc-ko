import jsQR from 'jsqr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseStallCode, ZONE_COLORS } from '@mtll/shared';
import { StallCode } from '../components/StallCode';
import { useContent } from '../state/content';
import { useSettings } from '../state/settings';

/**
 * UC04 Quét QR hoặc bấm số gian.
 *
 * Quét QR bằng camera ngay trong trang (thư viện jsQR), hoặc bấm / gõ số gian.
 */
export function ScanPage() {
  const { t } = useSettings();
  const { stalls, getStall, getZone } = useContent();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [manual, setManual] = useState('');
  const [error, setError] = useState<string | null>(null);

  /** `scanned` là true khi mã đến từ camera; chỉ khi đó mới ghi tem (qua trang /s/…). */
  const open = useCallback(
    (raw: string, scanned: boolean) => {
      const code = parseStallCode(raw);
      if (!code || !getStall(code)) {
        setError(t('scan.invalid'));
        return false;
      }
      navigate(scanned ? `/s/${code}` : `/gian/${code}`);
      return true;
    },
    [getStall, navigate, t],
  );

  return (
    <div className="stack">
      <h1>{t('scan.title')}</h1>
      {/* Đổi key để mở lại camera khi khách bấm thử lại. */}
      <Camera key={attempt} onCode={(code) => open(code, true)} onRetry={() => setAttempt((n) => n + 1)} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <h2>{t('scan.pick')}</h2>
      <p className="muted">{t('scan.pickNote')}</p>
      <div className="code-grid">
        {stalls.map((s) => {
          const zone = getZone(s.zoneId);
          return (
            <button key={s.id} className="plain" aria-label={s.id} onClick={() => open(s.id, false)}>
              <StallCode id={s.id} color={zone ? ZONE_COLORS[zone.kind] : 'var(--muted)'} size={52} />
            </button>
          );
        })}
      </div>
      <form
        className="manual"
        onSubmit={(e) => {
          e.preventDefault();
          open(manual, false);
        }}
      >
        <label className="sr-only" htmlFor="code">
          {t('scan.manual')}
        </label>
        <input
          id="code"
          value={manual}
          placeholder="F2"
          autoCapitalize="characters"
          autoComplete="off"
          onChange={(e) => {
            setManual(e.target.value);
            setError(null);
          }}
        />
        <button className="btn" disabled={!manual.trim()}>
          {t('scan.open')}
        </button>
      </form>
      <p className="muted">{t('scan.manual')}</p>
    </div>
  );
}

type CameraState = 'starting' | 'on' | 'error';

/** Khung camera sau của điện thoại. Mỗi khung hình được đưa qua jsQR; đọc được mã thì gọi onCode. */
function Camera({ onCode, onRetry }: { onCode: (code: string) => boolean; onRetry: () => void }) {
  const { t } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>(() => (window.isSecureContext && navigator.mediaDevices ? 'starting' : 'error'));
  // Luôn gọi bản onCode mới nhất mà không phải mở lại camera.
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!window.isSecureContext || !navigator.mediaDevices) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    let pausedUntil = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && ctx && video.readyState >= 2 && Date.now() > pausedUntil) {
        // Thu nhỏ khung hình để quét nhanh hơn trên điện thoại yếu.
        const scale = Math.min(1, 480 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (found?.data) {
          if (onCodeRef.current(found.data)) return;
          pausedUntil = Date.now() + 1500;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(async (s) => {
        stream = s;
        if (stopped) return;
        const video = videoRef.current!;
        video.srcObject = s;
        await video.play();
        setState('on');
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!stopped) setState('error');
      });

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  return (
    <div className="camera">
      <video ref={videoRef} playsInline muted hidden={state !== 'on'} />
      {state === 'on' && <div className="viewfinder" aria-hidden="true" />}
      {state === 'starting' && <p className="camera-msg">{t('scan.permission')}</p>}
      {state === 'error' && (
        <div className="camera-msg">
          <p>{t('scan.cameraError')}</p>
          <button className="btn" onClick={onRetry}>
            {t('scan.allow')}
          </button>
        </div>
      )}
    </div>
  );
}
