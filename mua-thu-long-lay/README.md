# Mùa thu lộng lẫy · Thuyết minh tự động đa ngôn ngữ

Đồ án môn Công nghệ phần mềm. Toàn bộ chạy trên web: **web quản trị** cho ban tổ chức và **web mobile** cho khách (mở bằng trình duyệt điện thoại, không cần cài app), dữ liệu lưu trong **SQL Server**.

Lễ hội ngoài trời "Mùa thu lộng lẫy" có 5 khu, 16 gian hàng (5 ẩm thực, 7 trò chơi, 4 trải nghiệm) và 4 suất diễn mỗi ngày. Khi khách đi vào vùng GPS của một khu, trang khách tự đọc thuyết minh bằng ngôn ngữ khách chọn (Việt, Anh, Trung, Hàn, Nhật, Đức).

## Cấu trúc

```
apps/guest       Web mobile cho khách (React + Vite): bản đồ, thuyết minh theo GPS, quét QR, lịch diễn, săn tem
apps/web         Web quản trị (React + Vite): sửa nội dung, dịch, duyệt bản dịch, lịch diễn, in QR, thông báo
apps/api         API Node.js (Express + mssql) nối hai trang web với SQL Server
database         Script tạo database cho SQL Server (mở bằng SSMS)
packages/shared  Dữ liệu lễ hội và logic dùng chung (geofence, đa ngôn ngữ, QR, lịch, tem, đổi dòng database) + test
.github          CI/CD: kiểm tra code, deploy web lên GitHub Pages
```

## Chạy thử

Yêu cầu: Node 24 (xem `.nvmrc`), npm.

```bash
npm install
npm run dev:api      # API nối SQL Server ở http://localhost:3001 (xem apps/api/README.md)
npm run dev:web      # web quản trị ở http://localhost:5173
npm run dev:guest    # trang khách ở https://<IP laptop>:5174, mở bằng điện thoại cùng Wi-Fi (xem apps/guest/README.md)
```

Đăng nhập web (bản demo): `admin@muathu.vn` / `muathu2026`. Khi API đang chạy, mọi thay đổi trên web quản trị được lưu vào SQL Server. Nếu không bật API, web tự chuyển sang chế độ demo và lưu tạm trong trình duyệt (localStorage).

Để khách vào web: mở trang **Tổng quan** (hoặc **Mã QR**) trên web quản trị, dùng điện thoại cùng Wi-Fi quét mã "Quét để vào web khách". Ô **Đang truy cập** ở Tổng quan cho biết hiện có bao nhiêu máy đang mở web khách (4 điện thoại đang mở thì hiện 4), còn khung **Khách truy cập theo ngày** đếm số máy theo 2 ngày lễ hội, bắt đầu từ 0. Muốn đếm lại từ đầu, chạy `DELETE FROM visit_events;` trong SSMS.

Trên trang khách, khi không ở lễ hội thật, chạm vào một khu trên bản đồ để giả lập đang đứng ở khu đó và nghe thuyết minh.

## Các lệnh

| Lệnh                              | Việc                                   |
| --------------------------------- | -------------------------------------- |
| `npm run lint`                    | Kiểm tra lỗi code (oxlint)             |
| `npm run format` / `format:check` | Định dạng code (Prettier)              |
| `npm run typecheck`               | Kiểm tra kiểu TypeScript cho các gói   |
| `npm test`                        | Chạy test (Vitest)                     |
| `npm run build:web`               | Build web ra `apps/web/dist`           |
| `npm run build:guest`             | Build trang khách ra `apps/guest/dist` |
| `npm run check`                   | Chạy tất cả các bước trên, giống CI    |

## CI/CD

| Workflow                  | Khi nào chạy             | Làm gì                                                                        |
| ------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `ci.yml` (CI)             | Mỗi push và pull request | Lint, kiểm tra format, typecheck, test, build web quản trị và trang khách     |
| `deploy-web.yml` (CD web) | Push lên `main`          | Build web quản trị và trang khách (thư mục `khach/`) rồi đưa lên GitHub Pages |

Thiết lập một lần trên GitHub:

1. Đẩy code lên một repo GitHub, nhánh `main`.
2. **Settings → Pages → Source: GitHub Actions** để bật deploy web. Link web sẽ là `https://<tên-tài-khoản>.github.io/<tên-repo>/`.
3. Nên bật **Settings → Branches → Branch protection** cho `main`, bắt buộc CI xanh trước khi merge.

Dependabot (`.github/dependabot.yml`) tự mở pull request cập nhật thư viện mỗi tuần.

## Database (SQL Server)

1. Mở SSMS, chạy `database/MuaThuLongLay.sql` để tạo bảng và dữ liệu mẫu.
2. Bật đăng nhập bằng mật khẩu và TCP/IP, điền `apps/api/.env`, rồi `npm run dev:api`. Từng bước có trong `apps/api/README.md`.
3. Trang khách đọc nội dung và ghi lượt quét qua API. Không có API thì trang vẫn chạy bằng dữ liệu mẫu.
