import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, apiAvailable, ApiError } from './api';

/**
 * Đăng nhập. Có API thì kiểm tra tài khoản trong bảng staff_users của SQL Server (POST /api/login).
 * Không có API (bản demo trên GitHub Pages) thì dùng tài khoản demo cố định.
 */
export const DEMO_ACCOUNT = { email: 'admin@muathu.vn', password: 'muathu2026' };

const KEY = 'mtll-admin-session';

interface Session {
  email: string;
  /** Mã phiên do API cấp. null nghĩa là đang ở chế độ demo, không có database. */
  token: string | null;
}

interface AuthValue {
  email: string | null;
  token: string | null;
  /** "api": đọc ghi SQL Server. "local": demo, lưu trong trình duyệt. */
  mode: 'checking' | 'api' | 'local';
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function readSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Session | null;
    return s && typeof s.email === 'string' ? s : null;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* vẫn đăng nhập trong phiên hiện tại */
  }
}

/**
 * UC09 Đăng nhập: giữ phiên đăng nhập (email + token) trong sessionStorage, đóng tab là phải đăng nhập lại.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  const [mode, setMode] = useState<AuthValue['mode']>('checking');

  useEffect(() => {
    apiAvailable().then((ok) => setMode(ok ? 'api' : 'local'));
  }, []);

  const login = useCallback(async (e: string, p: string) => {
    const email = e.trim().toLowerCase();
    let next: Session;
    if (await apiAvailable()) {
      try {
        const res = await api<{ token: string; email: string }>('/login', { method: 'POST', body: { email, password: p } });
        next = { email: res.email, token: res.token };
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return 'Email hoặc mật khẩu không đúng.';
        return `Không kết nối được SQL Server: ${(err as Error).message}`;
      }
    } else {
      if (email !== DEMO_ACCOUNT.email || p !== DEMO_ACCOUNT.password) return 'Email hoặc mật khẩu không đúng.';
      next = { email, token: null };
    }
    writeSession(next);
    setSession(next);
    return null;
  }, []);

  const token = session?.token ?? null;
  const logout = useCallback(() => {
    if (token) api('/logout', { method: 'POST', token }).catch(() => undefined);
    writeSession(null);
    setSession(null);
  }, [token]);

  const value = useMemo<AuthValue>(
    () => ({ email: session?.email ?? null, token, mode, login, logout }),
    [session, token, mode, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return ctx;
}
