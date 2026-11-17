import { useSyncExternalStore } from 'react';
import { speechLocale, type Lang } from '@mtll/shared';

/**
 * UC03 Nghe thuyết minh: đọc to đoạn chữ bằng giọng có sẵn của trình duyệt (Web Speech API),
 * đúng ngôn ngữ khách chọn. Không cần file âm thanh hay kết nối mạng.
 *
 * Giọng đọc của trình duyệt không có sẵn thanh tua, nên ở đây tự làm:
 * - Đoạn chữ được cắt thành từng câu, đọc lần lượt từng câu (Chrome hay tự dừng nếu đọc một đoạn quá dài).
 * - Thời lượng là ước tính theo số chữ và tốc độ đọc, đủ để hiện thanh tiến trình.
 * - Tua đến một chỗ = dừng giọng đang đọc rồi đọc lại từ chữ ở vị trí đó.
 */

/** Số ký tự đọc được trong 1 giây ở tốc độ 1×, dùng để ước tính thời lượng. */
const CHARS_PER_SEC: Record<Lang, number> = { vi: 14, en: 15, de: 14, zh: 4.5, ja: 6, ko: 6.5 };

export interface Sentence {
  start: number;
  text: string;
}

/** Cắt đoạn chữ thành các câu, nhớ vị trí ký tự bắt đầu của mỗi câu. */
export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  const re = /[^.!?。！？]+[.!?。！？]*\s*/g;
  for (const m of text.matchAll(re)) {
    if (m[0].trim()) out.push({ start: m.index, text: m[0] });
  }
  return out.length ? out : [{ start: 0, text }];
}

/** Lùi vị trí về đầu từ gần nhất, để không đọc nửa chữ. */
export function wordStart(text: string, pos: number) {
  let p = Math.max(0, Math.min(pos, text.length));
  while (p > 0 && !/\s/.test(text[p - 1])) p--;
  return p;
}

export interface NarratorState {
  /** Mã của đoạn đang mở (vd. "stall:F1"), để mỗi trang biết thanh phát có phải của mình không. */
  id: string | null;
  title: string;
  playing: boolean;
  /** Vị trí và tổng thời lượng (giây, ước tính). */
  position: number;
  duration: number;
}

let state: NarratorState = { id: null, title: '', playing: false, position: 0, duration: 0 };
const listeners = new Set<() => void>();
const emit = (patch: Partial<NarratorState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

// Đoạn đang đọc.
let text = '';
let lang: Lang = 'vi';
let rate = 1;
let sentences: Sentence[] = [];
/** Vị trí ký tự đang đọc tới. */
let offset = 0;
/** Mỗi lần bắt đầu đọc tăng số này; sự kiện của lượt đọc cũ (sau khi tua, dừng) bị bỏ qua. */
let run = 0;
let timer: ReturnType<typeof setInterval> | undefined;

const cps = () => CHARS_PER_SEC[lang] * rate;
const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : undefined);

function pickVoice(u: SpeechSynthesisUtterance) {
  const voices = synth()?.getVoices() ?? [];
  const prefix = u.lang.slice(0, 2);
  const voice = voices.find((v) => v.lang === u.lang) ?? voices.find((v) => v.lang.startsWith(prefix));
  if (voice) u.voice = voice;
}

/** Đọc từ ký tự `from`, câu nối câu, cho tới hết đoạn. */
function speakFrom(from: number) {
  const s = synth();
  const my = ++run;
  s?.cancel();
  clearInterval(timer);
  offset = wordStart(text, from);
  if (!s || offset >= text.length) {
    emit({ playing: false, position: offset >= text.length ? state.duration : state.position });
    return;
  }
  emit({ playing: true, position: offset / cps() });

  const next = () => {
    if (my !== run) return;
    const i = sentences.findIndex((x) => x.start + x.text.length > offset);
    if (i < 0) {
      clearInterval(timer);
      emit({ playing: false, position: state.duration });
      return;
    }
    const chunkStart = Math.max(offset, sentences[i].start);
    const chunk = text.slice(chunkStart, sentences[i].start + sentences[i].text.length);
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = speechLocale(lang);
    u.rate = rate;
    pickVoice(u);
    const began = Date.now();
    // Thanh tiến trình chạy theo thời gian ước tính; có sự kiện ranh giới từ thì dùng vị trí thật.
    clearInterval(timer);
    timer = setInterval(() => {
      if (my !== run) return;
      offset = Math.min(chunkStart + chunk.length, Math.max(offset, chunkStart + ((Date.now() - began) / 1000) * cps()));
      emit({ position: offset / cps() });
    }, 250);
    u.onboundary = (e) => {
      if (my === run && e.name === 'word') offset = chunkStart + e.charIndex;
    };
    u.onend = () => {
      if (my !== run) return;
      offset = chunkStart + chunk.length;
      next();
    };
    u.onerror = (e) => {
      // "interrupted" / "canceled" là do mình tự dừng khi tua, không phải lỗi.
      if (my !== run || e.error === 'interrupted' || e.error === 'canceled') return;
      clearInterval(timer);
      emit({ playing: false });
    };
    s.speak(u);
  };
  next();
}

export const narrator = {
  /** Mở một đoạn thuyết minh mới và đọc từ đầu. */
  play(id: string, title: string, body: string, l: Lang, r = 1) {
    text = body;
    lang = l;
    rate = r;
    sentences = splitSentences(body);
    emit({ id, title, position: 0, duration: body.length / cps() });
    speakFrom(0);
  },
  pause() {
    run++;
    synth()?.cancel();
    clearInterval(timer);
    emit({ playing: false, position: offset / cps() });
  },
  resume() {
    speakFrom(offset >= text.length ? 0 : offset);
  },
  /** Tua tới giây thứ `sec`. Đang dừng thì chỉ dời vị trí, bấm phát mới đọc. */
  seek(sec: number) {
    const pos = Math.round(Math.max(0, Math.min(sec, state.duration)) * cps());
    if (state.playing) speakFrom(pos);
    else {
      offset = wordStart(text, pos);
      emit({ position: offset / cps() });
    }
  },
  /** Nhảy tới câu trước (dir = -1) hoặc câu sau (dir = 1). */
  skip(dir: -1 | 1) {
    const i = sentences.findIndex((x) => x.start + x.text.length > offset);
    const cur = i < 0 ? sentences.length - 1 : i;
    // Đang ở giữa câu thì "câu trước" về đầu câu hiện tại, giống nút lùi của trình nghe nhạc.
    const target = dir < 0 ? (offset - sentences[cur].start > 3 ? cur : cur - 1) : cur + 1;
    const pos = target < 0 ? 0 : target >= sentences.length ? text.length : sentences[target].start;
    this.seek(pos / cps());
  },
  stop() {
    run++;
    synth()?.cancel();
    clearInterval(timer);
    offset = 0;
    emit({ id: null, playing: false, position: 0 });
  },
};

export function stopSpeaking() {
  narrator.stop();
}

/** Trạng thái thanh phát cho React. */
export function useNarrator(): NarratorState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}
