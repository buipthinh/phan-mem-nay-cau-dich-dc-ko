# Mùa thu lộng lẫy · Thuyết minh tự động đa ngôn ngữ

Đồ án môn Công nghệ phần mềm. Vai trò của nhóm: **FE DEV (React Native + React.js), làm giao diện Web và Mobile, kèm CI/CD.**

Lễ hội ngoài trời "Mùa thu lộng lẫy" có 5 khu, 16 gian hàng (5 ẩm thực, 7 trò chơi, 4 trải nghiệm) và 4 suất diễn mỗi ngày. Khi khách đi vào vùng GPS của một khu, app tự đọc thuyết minh bằng ngôn ngữ khách chọn (Việt, Anh, Trung, Hàn, Nhật, Đức).

## Cấu trúc

```
apps/mobile      App cho khách (Expo / React Native): bản đồ, thuyết minh theo GPS, quét QR, lịch diễn, săn tem
apps/web         Web quản trị (React + Vite): sửa nội dung, dịch, duyệt bản dịch, lịch diễn, in QR, thông báo
packages/shared  Dữ liệu lễ hội và logic dùng chung (geofence, đa ngôn ngữ, QR, lịch, tem) + 19 test
supabase         Lược đồ CSDL (có RLS) và Edge Function dịch tự động, dùng khi nối back end thật
.github          CI/CD: kiểm tra code, deploy web lên GitHub Pages, build app bằng EAS
```

## Chạy thử

Yêu cầu: Node 24 (xem `.nvmrc`), npm.

```bash
npm install
npm run dev:web      # web quản trị ở http://localhost:5173
npm run dev:mobile   # app mobile, quét mã bằng Expo Go trên điện thoại
```

Đăng nhập web (bản demo): `admin@muathu.vn` / `muathu2026`. Dữ liệu web lưu trong trình duyệt (localStorage); nút "Khôi phục dữ liệu mẫu" đưa về ban đầu.

Trên app mobile, khi không ở lễ hội thật, chạm vào một khu trên bản đồ để giả lập đang đứng ở khu đó và nghe thuyết minh.

## Các lệnh

| Lệnh                              | Việc                                  |
| --------------------------------- | ------------------------------------- |
| `npm run lint`                    | Kiểm tra lỗi code (oxlint)            |
| `npm run format` / `format:check` | Định dạng code (Prettier)             |
| `npm run typecheck`               | Kiểm tra kiểu TypeScript cho cả 3 gói |
| `npm test`                        | Chạy test (Vitest)                    |
| `npm run build:web`               | Build web ra `apps/web/dist`          |
| `npm run check`                   | Chạy tất cả các bước trên, giống CI   |

## CI/CD

| Workflow                       | Khi nào chạy                  | Làm gì                                                                           |
| ------------------------------ | ----------------------------- | -------------------------------------------------------------------------------- |
| `ci.yml` (CI)                  | Mỗi push và pull request      | Lint, kiểm tra format, typecheck, test, build web, đóng gói thử app Android      |
| `deploy-web.yml` (CD web)      | Push lên `main`               | Build và đưa web quản trị lên GitHub Pages                                       |
| `mobile-build.yml` (CD mobile) | Push lên `main` hoặc tag `v*` | Build app bằng EAS: `main` ra file APK để cài thử, tag `v1.0.0` ra bản phát hành |

Thiết lập một lần trên GitHub:

1. Đẩy code lên một repo GitHub, nhánh `main`.
2. **Settings → Pages → Source: GitHub Actions** để bật deploy web. Link web sẽ là `https://<tên-tài-khoản>.github.io/<tên-repo>/`.
3. Build app mobile (không bắt buộc, chưa làm thì workflow tự bỏ qua):
   - Tạo tài khoản ở expo.dev, chạy `cd apps/mobile && npx eas init` để gắn projectId vào `app.json`, rồi commit.
   - Tạo access token ở expo.dev → Account settings → Access tokens.
   - Thêm token vào repo: **Settings → Secrets and variables → Actions → New secret**, tên `EXPO_TOKEN`.
4. Nên bật **Settings → Branches → Branch protection** cho `main`, bắt buộc CI xanh trước khi merge.

Dependabot (`.github/dependabot.yml`) tự mở pull request cập nhật thư viện mỗi tuần.

## Nối Supabase (không bắt buộc)

Bản hiện tại chạy độc lập với dữ liệu mẫu. Khi cần dữ liệu dùng chung giữa web và app:

1. Tạo project Supabase, chạy `supabase/migrations/0001_init.sql`.
2. Deploy hàm dịch: `supabase functions deploy translate`, đặt secret `GOOGLE_TRANSLATE_API_KEY`.
3. Đặt `VITE_TRANSLATE_URL` (xem `apps/web/.env.example`) bằng URL của hàm đó. Chưa đặt thì web dùng bản dịch nháp giả để demo.
