import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { startPresence } from './lib/api';
import { Layout } from './components/Layout';
import { LanguagePage } from './pages/LanguagePage';
import { MapPage } from './pages/MapPage';
import { QrLandingPage } from './pages/QrLandingPage';
import { ScanPage } from './pages/ScanPage';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';
import { StallPage } from './pages/StallPage';
import { StallsPage } from './pages/StallsPage';
import { StampsPage } from './pages/StampsPage';
import { ContentProvider } from './state/content';
import { SettingsProvider, useSettings } from './state/settings';

function Routed() {
  const { lang } = useSettings();
  // UC10: báo "đang truy cập" suốt thời gian khách mở trang (kể cả lúc đang chọn ngôn ngữ).
  useEffect(() => startPresence(() => lang ?? 'vi'), [lang]);
  // UC01: lần đầu vào (kể cả khi vào thẳng từ mã QR) thì chọn ngôn ngữ trước; địa chỉ vẫn giữ nguyên.
  if (!lang) return <LanguagePage />;
  return (
    <Routes>
      {/* Mỗi địa chỉ (#/...) là một trang. Thanh tab dưới đáy nằm trong Layout. */}
      <Route element={<Layout />}>
        <Route index element={<MapPage />} /> {/* UC02, UC03 */}
        <Route path="gian" element={<StallsPage />} /> {/* UC05 */}
        <Route path="gian/:id" element={<StallPage />} /> {/* UC05 */}
        <Route path="quet" element={<ScanPage />} /> {/* UC04 */}
        <Route path="lich" element={<SchedulePage />} /> {/* UC06 */}
        <Route path="tem" element={<StampsPage />} /> {/* UC07 */}
        <Route path="cai-dat" element={<SettingsPage />} /> {/* UC08 */}
      </Route>
      {/* UC04 + UC07: địa chỉ in trong mã QR của gian */}
      <Route path="s/:id" element={<QrLandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <ContentProvider>
        <HashRouter>
          <Routed />
        </HashRouter>
      </ContentProvider>
    </SettingsProvider>
  );
}
