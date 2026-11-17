# Web mobile cho khách

Trang khách mở bằng trình duyệt điện thoại, không cần cài app: chọn ngôn ngữ, xem bản đồ, nghe thuyết minh,
quét QR hoặc gõ số gian, xem lịch diễn và săn tem.

## Chạy thử trên laptop và điện thoại

1. Bật API trước (xem `apps/api/README.md`): `npm run dev:api`
2. Mở một cửa sổ cmd khác ở thư mục gốc: `npm run dev:guest`
3. Màn hình hiện dòng `Network: https://192.168.x.x:5174/`. Điện thoại vào **cùng Wi‑Fi** với laptop rồi mở địa chỉ đó.
4. Trình duyệt báo "Kết nối không riêng tư" vì chứng chỉ tự tạo: bấm **Nâng cao → Tiếp tục truy cập**. Cần https thì điện thoại mới cho mở camera và GPS.
5. Nếu điện thoại không vào được: trên laptop, cho phép Node.js qua **Windows Firewall** (Private networks).

Trang tự gọi `/api/...` trên cùng địa chỉ, Vite chuyển tiếp sang API ở cổng 3001, nên điện thoại chỉ cần nhớ một địa chỉ.

## In mã QR mở thẳng trang khách

Trên web quản trị, vào **Mã QR**, nhập ô "Địa chỉ trang khách" là `https://192.168.x.x:5174/` rồi in.
Mỗi mã là link dạng `https://192.168.x.x:5174/#/s/F2`. Khách quét bằng camera thường của điện thoại là mở thẳng gian F2 và nhận tem.

## Dữ liệu lấy từ đâu

| Dữ liệu                                        | Nơi lưu                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| Khu, gian, lịch diễn, bản dịch, thông báo khẩn | SQL Server, đọc qua `GET /api/content` (thông báo hỏi lại mỗi phút) |
| Lượt quét, lượt nghe, lượt vào khu             | SQL Server, bảng `visit_events`, ghi qua `POST /api/visits`         |
| Ngôn ngữ đã chọn, tốc độ đọc, tem đã nhận      | Trình duyệt của khách (localStorage)                                |

Không gọi được API (ví dụ bản trên GitHub Pages) thì trang vẫn chạy bằng dữ liệu mẫu có sẵn. Trang Cài đặt ghi rõ đang dùng
"SQL Server ✓" hay "Offline".
