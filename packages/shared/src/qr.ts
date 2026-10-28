/** Địa chỉ trang web của khách dùng khi chưa cấu hình. Web quản trị cho đổi địa chỉ này trước khi in mã. */
export const QR_BASE_URL = 'https://mua-thu-long-lay.example/';

const CODE_PATTERN = /^[A-Z]\d{1,2}$/;

/**
 * UC15 In mã QR.
 *
 * Nội dung in trong mã QR của một gian: đường link tới trang khách, ví dụ https://…/khach/#/s/F2.
 * Khách quét bằng camera thường của điện thoại là mở thẳng trang gian hàng, không cần cài gì.
 */
export function stallQrValue(stallId: string, guestUrl: string = QR_BASE_URL): string {
  const base = guestUrl.trim().split('#')[0];
  return `${base.endsWith('/') || base.endsWith('.html') ? base : `${base}/`}#/s/${stallId}`;
}

/**
 * UC04 Quét QR hoặc gõ số gian.
 *
 * Đọc mã gian hàng từ nội dung QR hoặc chữ khách tự gõ.
 * Chấp nhận "F2", "f2", hoặc đường link ".../s/F2". Trả về null nếu không hợp lệ.
 */
export function parseStallCode(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  let candidate = text;
  const marker = '/s/';
  const at = text.lastIndexOf(marker);
  if (at >= 0) candidate = text.slice(at + marker.length).split(/[?#/]/)[0];
  candidate = candidate.toUpperCase();
  return CODE_PATTERN.test(candidate) ? candidate : null;
}
