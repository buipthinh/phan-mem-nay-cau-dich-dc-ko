import { NavLink, Outlet } from 'react-router-dom';
import { festival } from '@mtll/shared';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';

const NAV = [
  { to: '/', label: 'Tổng quan', end: true },
  { to: '/zones', label: 'Khu và thuyết minh' },
  { to: '/stalls', label: 'Gian hàng' },
  { to: '/schedule', label: 'Lịch diễn' },
  { to: '/qr', label: 'Mã QR' },
  { to: '/announcement', label: 'Thông báo' },
];

const SYNC_LABEL = {
  local: 'Chế độ demo: lưu trong trình duyệt',
  loading: 'Đang tải từ SQL Server...',
  saving: 'Đang lưu vào SQL Server...',
  saved: 'Đã lưu vào SQL Server',
  error: 'Lỗi lưu SQL Server',
} as const;

/**
 * Khung trang quản trị: menu bên trái, tình trạng lưu SQL Server, dải nhắc khi đang phát thông báo (UC16).
 */
export function Layout() {
  const { email, logout } = useAuth();
  const { data, reset, sync } = useStore();
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="eyebrow">Quản trị lễ hội</span>
          <strong>{festival.name.vi}</strong>
        </div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          <span>{email}</span>
          <button
            className="link"
            onClick={() => {
              if (sync.state !== 'local' || window.confirm('Xoá mọi thay đổi và khôi phục dữ liệu mẫu?')) reset();
            }}
          >
            {sync.state === 'local' ? 'Khôi phục dữ liệu mẫu' : 'Tải lại từ database'}
          </button>
          <span className={sync.state === 'error' ? 'sync error' : 'sync'} role="status">
            {SYNC_LABEL[sync.state]}
            {sync.state === 'error' && `: ${sync.message}`}
          </span>
          <button className="link" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="main">
        {data.announcement.active && (
          <div className="banner" role="status">
            Đang phát thông báo cho khách: {data.announcement.text}
          </div>
        )}
        {sync.state === 'loading' ? <p className="hint">Đang tải dữ liệu từ SQL Server...</p> : <Outlet />}
      </main>
    </div>
  );
}
