/** Địa chỉ in trong mã QR. Quét bằng camera thường cũng mở được trang web công khai của gian hàng. */
export const QR_BASE_URL = 'https://mua-thu-long-lay.example/s/';

const CODE_PATTERN = /^[A-Z]\d{1,2}$/;

export function stallQrValue(stallId: string): string {
  return QR_BASE_URL + stallId;
}

/**
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
