import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './lib/auth';
import { StoreProvider } from './lib/store';
import { AnnouncementPage } from './pages/AnnouncementPage';
import { DashboardPage } from './pages/DashboardPage';
import { GlossaryPage } from './pages/GlossaryPage';
import { LoginPage } from './pages/LoginPage';
import { PointsPage } from './pages/PointsPage';
import { QrPage } from './pages/QrPage';
import { SchedulePage } from './pages/SchedulePage';
import { StallEditPage } from './pages/StallEditPage';
import { TranslationsPage } from './pages/TranslationsPage';
import { ZoneEditPage } from './pages/ZoneEditPage';
import { StallNewPage } from './pages/StallNewPage';

function Routed() {
  const { email } = useAuth();
  // UC09: chưa đăng nhập thì chỉ thấy trang đăng nhập.
  if (!email) return <LoginPage />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} /> {/* UC10 */}
        <Route path="points" element={<PointsPage />} /> {/* UC11, UC12: khu và gian hàng gộp chung */}
        <Route path="points/zone/:id" element={<ZoneEditPage />} /> {/* UC11, UC13 */}
        <Route path="stalls/new" element={<StallNewPage />} /> {/* UC12: thêm gian hàng */}
        <Route path="stalls/:id" element={<StallEditPage />} /> {/* UC12, UC13 */}
        <Route path="translations" element={<TranslationsPage />} /> {/* UC13 */}
        <Route path="glossary" element={<GlossaryPage />} /> {/* UC13 */}
        <Route path="zones" element={<Navigate to="/points" replace />} />
        <Route path="stalls" element={<Navigate to="/points" replace />} />
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
