import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { parseStallCode } from '@mtll/shared';
import { logVisit } from '../lib/api';
import { useContent } from '../state/content';
import { useLang, useSettings } from '../state/settings';

/**
 * UC04 Quét QR + UC07 Săn tem.
 *
 * Địa chỉ in trong mã QR (…/#/s/F2). Khách quét bằng camera thường hoặc bằng trang Quét đều tới đây:
 * ghi tem, ghi lượt quét vào database, rồi mở trang gian hàng.
 */
export function QrLandingPage() {
  const { id = '' } = useParams();
  const code = parseStallCode(id);
  const { getStall, source } = useContent();
  const { collectStamp } = useSettings();
  const lang = useLang();
  const navigate = useNavigate();
  const done = useRef(false);
  const stall = code ? getStall(code) : undefined;

  useEffect(() => {
    if (!stall || done.current) return;
    done.current = true;
    const added = collectStamp(stall.id);
    logVisit('scan', { stallId: stall.id, zoneId: stall.zoneId }, lang);
    navigate(`/gian/${stall.id}`, { replace: true, state: { stamp: added ? 'new' : 'owned' } });
  }, [stall, collectStamp, lang, navigate]);

  // Gian mới thêm trong database: chờ tải xong dữ liệu rồi mới kết luận là không có.
  if (!stall && source === 'loading') return null;
  if (!stall) return <Navigate to={`/gian/${code ?? id}`} replace />;
  return null;
}
