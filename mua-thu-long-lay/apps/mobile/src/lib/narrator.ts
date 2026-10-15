import * as Speech from 'expo-speech';
import { speechLocale, type Lang } from '@mtll/shared';

/**
 * Đọc thuyết minh bằng giọng TTS của điện thoại (chạy được khi offline).
 * Bản đầy đủ có thể phát file MP3 do web quản trị tạo sẵn; khi chưa có file thì dùng cách này.
 */
export function speak(text: string, lang: Lang, rate = 1, onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, {
    language: speechLocale(lang),
    rate,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
