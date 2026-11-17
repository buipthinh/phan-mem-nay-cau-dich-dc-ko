/**
 * UC13 Dịch tự động bằng MyMemory (https://mymemory.translated.net), dịch vụ dịch máy miễn phí, không cần tài khoản.
 *
 * Giới hạn của MyMemory: mỗi lần gửi tối đa 500 ký tự, mỗi ngày khoảng 5.000 ký tự cho mỗi địa chỉ IP
 * (50.000 ký tự nếu điền email vào MYMEMORY_EMAIL trong file .env). Vì vậy đoạn dài được cắt theo câu rồi dịch từng phần.
 *
 * Thuật ngữ: trước khi gửi đi, các từ tiếng Việt có trong bảng thuật ngữ được thay bằng bản dịch cố định,
 * để tên lễ hội, món đặc sản... luôn dịch giống nhau.
 */

const URL_BASE = 'https://api.mymemory.translated.net/get';
const MAX_CHARS = 450;

/** Mã ngôn ngữ của hệ thống -> mã MyMemory dùng. */
const MYMEMORY_LANG = { vi: 'vi', en: 'en', zh: 'zh-CN', ko: 'ko', ja: 'ja', de: 'de' };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Thay các thuật ngữ tiếng Việt bằng bản dịch cố định của ngôn ngữ `lang`.
 * `terms` là mảng { term_vi, translations: { en: '...', ... } }. Từ dài thay trước để "tranh Đông Hồ" không bị "tranh" cắt mất.
 * Chỉ thay nguyên từ (không thay "cốm" nằm trong một từ khác), không phân biệt chữ hoa chữ thường.
 */
export function applyGlossary(text, terms, lang) {
  const sorted = [...terms].filter((t) => t.translations?.[lang]).sort((a, b) => b.term_vi.length - a.term_vi.length);
  let out = text;
  for (const t of sorted) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(t.term_vi)}(?![\\p{L}\\p{N}])`, 'giu');
    out = out.replace(re, t.translations[lang]);
  }
  return out;
}

/** Cắt đoạn dài thành các phần không quá `max` ký tự, ưu tiên cắt ở cuối câu, rồi đến dấu phẩy, cuối cùng là khoảng trắng. */
export function splitText(text, max = MAX_CHARS) {
  const parts = [];
  let rest = text.trim();
  while (rest.length > max) {
    const head = rest.slice(0, max);
    const cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
    const at = cut > max / 3 ? cut + 1 : Math.max(head.lastIndexOf(', ') + 1, head.lastIndexOf(' '));
    const end = at > 0 ? at : max;
    parts.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/** Gọi MyMemory dịch một phần (≤ 500 ký tự). Lỗi thì ném Error có câu báo tiếng Việt. */
async function translatePart(text, target, fetchImpl) {
  const params = new URLSearchParams({ q: text, langpair: `vi|${MYMEMORY_LANG[target] ?? target}` });
  if (process.env.MYMEMORY_EMAIL) params.set('de', process.env.MYMEMORY_EMAIL);
  let res;
  try {
    res = await fetchImpl(`${URL_BASE}?${params}`, { signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error('Không kết nối được MyMemory. Kiểm tra mạng Internet của laptop rồi thử lại.');
  }
  const body = await res.json().catch(() => null);
  const status = Number(body?.responseStatus ?? res.status);
  const translated = body?.responseData?.translatedText;
  if (status === 429 || /YOU USED ALL AVAILABLE FREE TRANSLATIONS/i.test(translated ?? '')) {
    throw new Error(
      'MyMemory báo đã hết lượt dịch miễn phí hôm nay. Điền MYMEMORY_EMAIL trong apps/api/.env để có thêm lượt, hoặc thử lại ngày mai.',
    );
  }
  if (status !== 200 || !translated) throw new Error(`MyMemory trả lỗi: ${body?.responseDetails ?? res.status}`);
  return translated;
}

/**
 * Dịch `text` tiếng Việt sang `target` (en, zh, ko, ja, de), có áp thuật ngữ.
 * `fetchImpl` để test truyền hàm giả, chạy thật thì dùng fetch có sẵn của Node.
 */
export async function translateText(text, target, terms = [], fetchImpl = fetch) {
  if (!text?.trim()) return '';
  const prepared = applyGlossary(text, terms, target);
  const out = [];
  for (const part of splitText(prepared)) out.push(await translatePart(part, target, fetchImpl));
  // Tiếng Trung, Nhật không dùng khoảng trắng giữa các câu.
  return out.join(target === 'zh' || target === 'ja' ? '' : ' ');
}
