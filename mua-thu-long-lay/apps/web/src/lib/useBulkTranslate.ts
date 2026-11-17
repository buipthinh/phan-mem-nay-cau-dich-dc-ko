import { useState } from 'react';
import { useAuth } from './auth';
import { translatePoint, type Target } from './points';
import { useStore, type Point } from './store';

export interface TranslateJob {
  point: Point;
  lang: Target;
}

/**
 * UC13 Dịch hàng loạt: dịch lần lượt từng (điểm, ngôn ngữ) bằng MyMemory, xong cái nào lưu thành "Chờ duyệt" cái đó.
 * Gặp lỗi (ví dụ hết lượt dịch miễn phí trong ngày) thì dừng lại, những cái đã dịch xong vẫn giữ.
 */
export function useBulkTranslate() {
  const { token } = useAuth();
  const { setPointTexts } = useStore();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function run(jobs: TranslateJob[]) {
    setMessage(null);
    if (!jobs.length) {
      setMessage({ error: false, text: 'Không có bản dịch nào cần dịch: các điểm đã chọn đều đã dịch xong.' });
      return;
    }
    let done = 0;
    setProgress({ done, total: jobs.length });
    try {
      for (const job of jobs) {
        const changes = await translatePoint(job.point, job.lang, token);
        setPointTexts(job.point.key, job.lang, changes, 'draft');
        setProgress({ done: ++done, total: jobs.length });
      }
      setMessage({ error: false, text: `Đã dịch ${done} bản. Vào trang Duyệt bản dịch, tab "Chờ duyệt" để đọc lại và duyệt.` });
    } catch (err) {
      setMessage({ error: true, text: `Đã dịch ${done}/${jobs.length} bản thì dừng: ${(err as Error).message}` });
    } finally {
      setProgress(null);
    }
  }

  return { run, progress, message, busy: progress !== null };
}
