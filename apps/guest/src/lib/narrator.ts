import { speechLocale, type Lang } from '@mtll/shared';

/**
 * UC03 Nghe thuyết minh: đọc to đoạn chữ bằng giọng có sẵn của trình duyệt (Web Speech API),
 * đúng ngôn ngữ khách chọn. Không cần file âm thanh hay kết nối mạng.
 */
export function speak(text: string, lang: Lang, rate = 1, onDone?: () => void) {
  const synth = window.speechSynthesis;
  if (!synth) {
    onDone?.();
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = speechLocale(lang);
  u.rate = rate;
  // Chọn giọng đúng ngôn ngữ nếu máy có, không thì để trình duyệt tự chọn.
  const prefix = u.lang.slice(0, 2);
  const voice = synth.getVoices().find((v) => v.lang === u.lang) ?? synth.getVoices().find((v) => v.lang.startsWith(prefix));
  if (voice) u.voice = voice;
  u.onend = () => onDone?.();
  u.onerror = () => onDone?.();
  synth.speak(u);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
