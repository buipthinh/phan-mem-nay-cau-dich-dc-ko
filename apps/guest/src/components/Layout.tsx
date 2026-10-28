import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useContent } from '../state/content';
import { useSettings } from '../state/settings';
import { Icon, type IconName } from './Icon';

/**
 * UC16 Thông báo khẩn (phía khách): hiện dải thông báo khi ban tổ chức đang bật thông báo.
 *
 * Khung trang cho điện thoại: thanh tiêu đề, dải thông báo khẩn, thanh tab dưới đáy.
 */
export function Layout() {
  const { t, tl } = useSettings();
  const { name, announcement } = useContent();
  const navigate = useNavigate();
  const tabs: { to: string; icon: IconName; label: string }[] = [
    { to: '/', icon: 'map', label: t('tab.map') },
    { to: '/gian', icon: 'stalls', label: t('tab.stalls') },
    { to: '/quet', icon: 'qr', label: 'QR' },
    { to: '/lich', icon: 'shows', label: t('tab.schedule') },
    { to: '/tem', icon: 'stamps', label: t('tab.stamps') },
  ];

  return (
    <div className="shell">
      <header className="topbar">
        <strong>{tl(name)}</strong>
        <button className="icon-btn" aria-label={t('tab.settings')} onClick={() => navigate('/cai-dat')}>
          <Icon name="settings" />
        </button>
      </header>
      {announcement && (
        <div className="announcement" role="alert">
          <strong>{t('app.announcement')}</strong>
          <span>{announcement.text_vi}</span>
        </div>
      )}
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => (isActive ? 'tab on' : 'tab')}>
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
