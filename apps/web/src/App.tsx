import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './lib/auth';
import { StoreProvider } from './lib/store';
import { AnnouncementPage } from './pages/AnnouncementPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { QrPage } from './pages/QrPage';
import { SchedulePage } from './pages/SchedulePage';
import { StallEditPage } from './pages/StallEditPage';
import { StallsPage } from './pages/StallsPage';
import { ZonesPage } from './pages/ZonesPage';

function Routed() {
  const { email } = useAuth();
  // UC09: chưa đăng nhập thì chỉ thấy trang đăng nhập.
  if (!email) return <LoginPage />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} /> {/* UC10 */}
        <Route path="zones" element={<ZonesPage />} /> {/* UC11, UC13 */}
        <Route path="stalls" element={<StallsPage />} /> {/* UC12 */}
        <Route path="stalls/:id" element={<StallEditPage />} /> {/* UC12, UC13 */}
        <Route path="schedule" element={<SchedulePage />} /> {/* UC14 */}
        <Route path="qr" element={<QrPage />} /> {/* UC15 */}
        <Route path="announcement" element={<AnnouncementPage />} /> {/* UC16 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// HashRouter để chạy được trên GitHub Pages (không cần cấu hình server cho đường dẫn con).
export function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <HashRouter>
          <Routed />
        </HashRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
