import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * UC15: mã QR mở trang chủ của web khách.
 * Lễ hội trong đồ án là giả định nên không có bảng QR ở cổng vào: ban tổ chức (hoặc thầy) dùng điện thoại
 * quét mã này ngay trên màn hình quản trị để vào web khách.
 */
export function GuestQr({ url, size = 220 }: { url: string; size?: number }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let alive = true;
    // Thư viện qrcode vẽ mã QR thành ảnh PNG (dạng data URL) để gắn vào thẻ <img>.
    QRCode.toDataURL(url, { margin: 1, width: size * 2 }).then(
      (data) => alive && setSrc(data),
      () => alive && setSrc(''),
    );
    return () => {
      alive = false;
    };
  }, [url, size]);

  return (
    <div className="guest-qr">
      {src ? (
        <img src={src} alt="Mã QR mở web khách" width={size} height={size} />
      ) : (
        <div className="qr-ph" style={{ width: size, height: size }} />
      )}
      <a href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
    </div>
  );
}
