import { useEffect, useState } from 'react';
import { api, apiAvailable } from './api';

const KEY = 'mtll-guest-url';

/**
 * UC15 In mã QR: địa chỉ trang web của khách, dùng để tạo link trong mã QR.
 * - Bản trên GitHub Pages: thư mục khach/ cạnh web quản trị.
 * - Chạy trên laptop (có API): https://<IP Wi‑Fi của laptop>:5174/, để điện thoại cùng Wi‑Fi quét là vào được.
 * Người dùng có thể sửa tay trên trang Mã QR; khi đã sửa thì dùng địa chỉ đã sửa.
 */
export function defaultGuestUrl(): string {
  return import.meta.env.VITE_GUEST_URL ?? new URL('khach/', window.location.href.split('#')[0]).href;
}

function readSaved(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Hỏi API địa chỉ IP của laptop để đoán sẵn địa chỉ web khách. */
async function guessLocalGuestUrl(): Promise<string | null> {
  if (import.meta.env.VITE_GUEST_URL || !(await apiAvailable())) return null;
  try {
    const { ips } = await api<{ ips: string[] }>('/network');
    return ips[0] ? `http://${ips[0]}:5174/` : null;
  } catch {
    return null;
  }
}

export function useGuestUrl(): [string, (url: string) => void, () => void] {
  const [saved, setSaved] = useState<string | null>(readSaved);
  const [guess, setGuess] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    guessLocalGuestUrl().then((url) => alive && setGuess(url));
    return () => {
      alive = false;
    };
  }, []);

  const set = (url: string) => {
    setSaved(url);
    try {
      localStorage.setItem(KEY, url);
    } catch {
      // Không lưu được thì chỉ dùng trong lần mở này.
    }
  };
  /** Bỏ địa chỉ đã sửa tay, quay về địa chỉ tự đoán. */
  const reset = () => {
    setSaved(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      // bỏ qua
    }
  };
  return [saved || guess || defaultGuestUrl(), set, reset];
}
