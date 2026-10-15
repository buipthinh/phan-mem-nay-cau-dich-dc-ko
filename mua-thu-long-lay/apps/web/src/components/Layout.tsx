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

export function Layout() {
  const { email, logout } = useAuth();
  const { data, reset } = useStore();
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
              if (window.confirm('Xoá mọi thay đổi và khôi phục dữ liệu mẫu?')) reset();
            }}
          >
            Khôi phục dữ liệu mẫu
          </button>
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
        <Outlet />
      </main>
    </div>
  );
}
