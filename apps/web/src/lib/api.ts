/**
 * Gọi API Node (apps/api) để đọc và ghi SQL Server.
 * Khi chạy `npm run dev:web`, Vite chuyển /api sang http://localhost:3001 (xem vite.config.ts).
 * Không có API (ví dụ bản trên GitHub Pages) thì web chạy chế độ demo, lưu trong trình duyệt.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let available: Promise<boolean> | null = null;

/** Có API hay không, chỉ hỏi một lần. API có trả lời (kể cả báo lỗi database) là tính là có. */
export function apiAvailable(): Promise<boolean> {
  available ??= fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(4000) })
    .then((res) => Boolean(res.headers.get('content-type')?.includes('json')))
    .catch(() => false);
  return available;
}

export async function api<T = void>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, err?.error ?? `Lỗi ${res.status}`);
  }
  return (res.status === 204 || res.status === 201 ? undefined : await res.json()) as T;
}
