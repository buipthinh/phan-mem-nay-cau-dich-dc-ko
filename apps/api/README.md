# API nối web với SQL Server

Web (quản trị và mobile) không nối thẳng vào SQL Server. Web gọi API này, API mới đọc và ghi database.

```
Trình duyệt  --HTTP-->  API Node (apps/api, cổng 3001)  --mssql-->  SQL Server (xem bằng SSMS)
```

## Bước 1. Tạo database bằng SSMS

1. Mở SSMS, đăng nhập bằng **Windows Authentication**. Nhớ tên ô **Server name**, ví dụ `DESKTOP-ABC\SQLEXPRESS` hoặc `localhost`.
2. Bấm **File → Open → File...**, chọn `database/MuaThuLongLay.sql`, rồi bấm **Execute** (F5).
3. Cuối kết quả hiện bảng đếm số dòng (5 khu, 16 gian, 4 suất diễn...) là xong. Script cũng tạo tài khoản `mtll_app` / `MuaThu@2026` cho API.

## Bước 2. Cho phép API đăng nhập vào SQL Server (làm 1 lần)

Node không dùng được Windows Authentication, nên phải bật đăng nhập bằng mật khẩu và bật TCP/IP.

1. **Bật đăng nhập bằng mật khẩu:** trong SSMS, chuột phải tên server ở Object Explorer → **Properties** → **Security** → chọn **SQL Server and Windows Authentication mode** → OK.
2. **Bật TCP/IP:** mở **SQL Server Configuration Manager** (gõ tên này ở ô tìm kiếm Windows; nếu không thấy, mở `SQLServerManager16.msc` hoặc `SQLServerManager15.msc`).
   Vào **SQL Server Network Configuration → Protocols for SQLEXPRESS** (hoặc MSSQLSERVER) → chuột phải **TCP/IP** → **Enable**.
3. **Bật SQL Server Browser** (chỉ cần khi Server name có dấu `\`, ví dụ `\SQLEXPRESS`): trong **SQL Server Services**, chuột phải **SQL Server Browser** → Properties → Service → Start Mode: **Automatic** → OK → chuột phải → **Start**.
4. **Khởi động lại SQL Server:** trong **SQL Server Services**, chuột phải **SQL Server (SQLEXPRESS)** → **Restart**.

## Bước 3. Điền thông tin kết nối

Trong thư mục `apps/api`, chép `.env.example` thành `.env`:

```
copy .env.example .env
```

Mở `.env` và sửa theo Server name ở Bước 1:

| Server name trong SSMS                        | DB_SERVER   | DB_INSTANCE  |
| --------------------------------------------- | ----------- | ------------ |
| `DESKTOP-ABC\SQLEXPRESS` hoặc `.\SQLEXPRESS`  | `localhost` | `SQLEXPRESS` |
| `localhost` hoặc `DESKTOP-ABC` (bản mặc định) | `localhost` | để trống     |

File `.env` chứa mật khẩu nên đã nằm trong `.gitignore`, không bị đưa lên GitHub.

## Bước 4. Chạy thử

Ở thư mục gốc của dự án:

```
npm install
cd apps\api
npm run test-db
```

Hiện **"Kết nối SQL Server thành công!"** kèm bảng số dòng là đã nối được. Sau đó chạy API:

```
npm run dev
```

Mở trình duyệt vào http://localhost:3001/api/health, thấy `{"ok":true}` là API đã chạy và đọc được database.

Đổi hoặc thêm tài khoản ban tổ chức (mật khẩu được băm trước khi lưu):

```
npm run create-admin -- email@vd.vn MatKhauMoi "Họ tên"
```

## Các API có sẵn

| Đường dẫn                                                                | Ai dùng      | Làm gì                                                      |
| ------------------------------------------------------------------------ | ------------ | ----------------------------------------------------------- |
| `GET /api/health`                                                        | ai cũng được | Kiểm tra API và database                                    |
| `GET /api/content`                                                       | khách        | Khu, gian, lịch diễn, bản dịch đã duyệt, thông báo mới nhất |
| `POST /api/visits`                                                       | khách        | Ghi 1 lượt quét / nghe / vào khu vào `visit_events`         |
| `POST /api/login`                                                        | ban tổ chức  | Đăng nhập, trả về `token`                                   |
| `GET /api/admin/content`                                                 | ban tổ chức  | Như `/api/content` nhưng có cả bản nháp                     |
| `PUT /api/zones/:id`, `PUT/DELETE /api/stalls/:id`, `PUT /api/shows/:id` | ban tổ chức  | Sửa khu, gian, lịch diễn                                    |
| `PUT /api/translations`                                                  | ban tổ chức  | Lưu nhiều bản dịch một lần                                  |
| `PUT /api/announcement`                                                  | ban tổ chức  | Đăng thông báo khẩn                                         |
| `GET /api/stats`                                                         | ban tổ chức  | Số liệu thật cho trang Tổng quan                            |

Các API của ban tổ chức cần gửi kèm header `Authorization: Bearer <token>`.

## Sửa lỗi thường gặp

| Lỗi                                                       | Cách sửa                                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Login failed for user 'mtll_app'`                        | Chưa làm Bước 2 mục 1, hoặc chưa Restart SQL Server sau khi đổi.                                              |
| `Failed to connect to localhost:1433` hoặc `ECONNREFUSED` | Chưa bật TCP/IP (Bước 2 mục 2) hoặc chưa Restart. Nếu dùng SQLEXPRESS thì phải điền `DB_INSTANCE=SQLEXPRESS`. |
| `Port for SQLEXPRESS not found`                           | SQL Server Browser chưa chạy (Bước 2 mục 3).                                                                  |
| `Cannot open database "MuaThuLongLay"`                    | Chưa chạy script ở Bước 1.                                                                                    |
| `node: .env: not found`                                   | Chưa chép `.env.example` thành `.env` trong `apps/api`.                                                       |
