import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Đăng nhập dạng demo, chỉ để chạy thử giao diện khi chưa có backend.
 * Bản thật dùng Supabase Auth (email + mật khẩu) và kiểm tra quyền bằng Row Level Security.
 */
export const DEMO_ACCOUNT = { email: 'admin@muathu.vn', password: 'muathu2026' };

const KEY = 'mtll-admin-session';

interface AuthValue {
  email: string | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function readSession(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(readSession);

  const value: AuthValue = {
    email,
    login: (e, p) => {
      if (e.trim().toLowerCase() !== DEMO_ACCOUNT.email || p !== DEMO_ACCOUNT.password) return 'Email hoặc mật khẩu không đúng.';
      try {
        sessionStorage.setItem(KEY, DEMO_ACCOUNT.email);
      } catch {
        /* vẫn đăng nhập trong phiên hiện tại */
      }
      setEmail(DEMO_ACCOUNT.email);
      return null;
    },
    logout: () => {
      try {
        sessionStorage.removeItem(KEY);
      } catch {
        /* bỏ qua */
      }
      setEmail(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return ctx;
}
