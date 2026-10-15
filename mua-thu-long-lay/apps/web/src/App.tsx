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
  if (!email) return <LoginPage />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="zones" element={<ZonesPage />} />
        <Route path="stalls" element={<StallsPage />} />
        <Route path="stalls/:id" element={<StallEditPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="qr" element={<QrPage />} />
        <Route path="announcement" element={<AnnouncementPage />} />
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
