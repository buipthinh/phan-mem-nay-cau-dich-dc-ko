import { useState, type FormEvent } from 'react';
import { festival } from '@mtll/shared';
import { DEMO_ACCOUNT, useAuth } from '../lib/auth';

/**
 * UC09 Đăng nhập: trang đăng nhập của ban tổ chức.
 */
export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await login(email, password);
    // Đăng nhập thành công thì trang này biến mất, chỉ cập nhật khi còn lỗi.
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <span className="eyebrow">Quản trị lễ hội</span>
        <h1>{festival.name.vi}</h1>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="label" htmlFor="password">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        <p className="hint">
          Tài khoản demo: {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
        </p>
      </form>
    </div>
  );
}
