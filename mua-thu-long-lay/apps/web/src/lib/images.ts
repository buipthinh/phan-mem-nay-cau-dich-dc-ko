import { ApiError, mediaUrl } from './api';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/** Thu nhỏ ảnh trên trình duyệt (cạnh dài tối đa `max` px, lưu JPEG) để tải lên nhanh và trang khách mở nhẹ. */
export async function shrinkImage(file: File, max: number): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('File này không phải ảnh. Chọn file JPG, PNG hoặc WEBP.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không đọc được ảnh này.'))), 'image/jpeg', 0.82),
  );
}

/**
 * UC12 Tải ảnh gian hàng. Có SQL Server: gửi lên API, nhận lại đường dẫn /api/uploads/...
 * Chế độ demo: nhúng thẳng ảnh (nhỏ hơn) vào dữ liệu trong trình duyệt.
 */
export async function uploadImage(file: File, token: string | null): Promise<string> {
  if (!token) {
    const blob = await shrinkImage(file, 640);
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(blob);
    });
  }
  const blob = await shrinkImage(file, 1280);
  const res = await fetch(`${BASE}/api/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg', Authorization: `Bearer ${token}` },
    body: blob,
  });
  const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !body?.url) throw new ApiError(res.status, body?.error ?? `Lỗi ${res.status}`);
  return body.url;
}

export { mediaUrl };
