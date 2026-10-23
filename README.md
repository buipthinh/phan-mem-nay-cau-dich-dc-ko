# Use case nằm ở file nào trong code

Mỗi use case có 2 phần: **màn hình** (giao diện, nằm trong `apps/mobile` hoặc `apps/web`) và **logic** (quy tắc xử lý, phần lớn nằm trong `packages/shared/src`). Chữ hiển thị của mọi màn hình lấy từ `packages/shared/src/messages.ts`; dữ liệu khu, gian, suất diễn lấy từ `packages/shared/src/data/festival.ts`.

## App mobile (khách tham quan) – thư mục `apps/mobile`

| Use case | Màn hình | Logic |
| --- | --- | --- |
| UC01 Chọn ngôn ngữ | `src/screens/LanguageScreen.tsx` | `pickLang` trong `packages/shared/src/i18n.ts`; lưu lựa chọn ở `src/state/settings.tsx` |
| UC02 Xem bản đồ lễ hội | `src/screens/MapScreen.tsx`, `src/components/FestivalMapView.tsx` | `src/lib/useZoneTracking.ts` cho biết khách đang ở khu nào |
| UC03 Nghe thuyết minh tự động | `src/screens/MapScreen.tsx` | `src/lib/useZoneTracking.ts` (theo dõi GPS), `createZoneTracker` trong `packages/shared/src/geo.ts`, `src/lib/narrator.ts` (giọng đọc) |
| UC04 Quét QR hoặc bấm số gian | `src/screens/ScannerScreen.tsx` | `parseStallCode` trong `packages/shared/src/qr.ts`; cộng tem ở `src/state/settings.tsx` |
| UC05 Xem danh sách và chi tiết gian | `src/screens/StallsScreen.tsx`, `src/screens/StallDetailScreen.tsx` | `resolveText` (bản thay thế khi thiếu dịch) trong `packages/shared/src/i18n.ts` |
| UC06 Lịch diễn và nhắc giờ | `src/screens/ScheduleScreen.tsx` | `src/lib/reminders.ts`, `packages/shared/src/schedule.ts` |
| UC07 Săn tem đổi quà | `src/screens/StampsScreen.tsx` | `packages/shared/src/stamps.ts`, `src/state/settings.tsx` |
| UC08 Cài đặt | `src/screens/SettingsScreen.tsx` | `src/state/settings.tsx` (ngôn ngữ, tự đọc, tốc độ đọc) |

Các tab của app được khai báo trong `apps/mobile/App.tsx`.

## Web quản trị (ban tổ chức) – thư mục `apps/web`

| Use case | Trang | Logic |
| --- | --- | --- |
| UC09 Đăng nhập | `src/pages/LoginPage.tsx` | `src/lib/auth.tsx` |
| UC10 Tổng quan thống kê | `src/pages/DashboardPage.tsx` | `src/lib/stats.ts` (số liệu mẫu) |
| UC11 Quản lý khu và thuyết minh | `src/pages/ZonesPage.tsx`, `src/components/FestivalMap.tsx` | `src/lib/store.tsx` |
| UC12 Quản lý gian hàng | `src/pages/StallsPage.tsx`, `src/pages/StallEditPage.tsx` | `src/lib/store.tsx` (`markOutdated`: sửa bản gốc thì bản dịch thành "Cần dịch lại") |
| UC13 Dịch tự động và duyệt | `src/components/TranslationPanel.tsx` | `src/lib/translator.ts`; hàm dịch trên server ở `supabase/functions/translate` |
| UC14 Quản lý lịch diễn | `src/pages/SchedulePage.tsx` | `src/lib/store.tsx` |
| UC15 In mã QR | `src/pages/QrPage.tsx` | `stallQrValue` trong `packages/shared/src/qr.ts` |
| UC16 Phát thông báo khẩn | `src/pages/AnnouncementPage.tsx` | `src/lib/store.tsx` |

Các trang của web được khai báo trong `apps/web/src/App.tsx`; menu bên trái ở `src/components/Layout.tsx`.

## Lưu ý

UC16 mới có phía web. App mobile chưa hiện dải thông báo, vì web và app chưa dùng chung dữ liệu (cần nối Supabase). PRD đã được sửa lại cho đúng chỗ này.
