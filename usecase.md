# Phân tích yêu cầu: Hệ thống thuyết minh bảo tàng đa ngôn ngữ

## Tổng quan
Hệ thống giúp khách tham quan bảo tàng nghe thuyết minh hiện vật bằng ngôn ngữ của mình, chỉ cần quét mã QR đặt cạnh hiện vật. Quản trị viên chỉ nhập nội dung tiếng Việt một lần, hệ thống tự dịch và tạo file âm thanh cho các ngôn ngữ còn lại.

**Hệ thống gồm 3 phần:**
1. **App mobile cho khách (React Native + Expo):** Quét QR, nghe thuyết minh, dùng được khi không có mạng.
2. **Web quản trị (React.js):** Quản lý hiện vật, nội dung, mã QR và thống kê.
3. **Backend (có sẵn Supabase):** Đề tài nhóm chọn mục 1 (chỉ làm FE) nên không tự viết server. Supabase cung cấp cơ sở dữ liệu, đăng nhập, lưu ảnh và audio; dịch máy và TTS chạy trong Supabase Edge Functions. Gói Free của Supabase đủ cho đồ án.

> **Mục tiêu demo:** Hỗ trợ tối thiểu 4 ngôn ngữ (Việt, Anh, Trung, Hàn), có ít nhất 20 hiện vật mẫu. Từ lúc quét QR đến lúc phát audio **dưới 3 giây** (khi có mạng).

---

## Bước 1.1: Tác nhân
Hệ thống có 2 tác nhân là người và 2 tác nhân là hệ thống ngoài.

| Tác nhân | Loại | Mô tả | Dùng phần nào |
| :--- | :--- | :--- | :--- |
| **Khách tham quan** | Người | Khách trong nước và quốc tế, không cần đăng nhập | App mobile |
| **Quản trị viên** | Người | Nhân viên nhập nội dung, quản lý hiện vật, xem thống kê | Web quản trị |
| **Dịch vụ dịch máy** | Hệ thống ngoài | Google Translate API, DeepL hoặc LLM | Edge Function gọi |
| **Dịch vụ TTS** | Hệ thống ngoài | Google Cloud TTS hoặc Azure Speech | Edge Function gọi |

*(Có thể mở rộng thêm vai trò Super Admin - quản lý tài khoản nhân viên - nếu giảng viên yêu cầu phân quyền).*

---

## Bước 1.2: Danh sách chức năng
**Độ ưu tiên:** `P1` = Bắt buộc cho demo | `P2` = Nên có | `P3` = Làm nếu còn thời gian.

### App mobile (Khách tham quan)
| Mã | Chức năng | Mô tả ngắn | Ưu tiên |
| :--- | :--- | :--- | :---: |
| **M01** | Chọn ngôn ngữ | Lần đầu tự nhận ngôn ngữ máy, cho đổi trong cài đặt | P1 |
| **M02** | Quét QR hiện vật | Mở camera, quét mã và chuyển tới trang hiện vật | P1 |
| **M03** | Xem chi tiết hiện vật| Ảnh, tên, niên đại, mô tả theo ngôn ngữ đã chọn | P1 |
| **M04** | Nghe thuyết minh | Phát, dừng, tua, đổi tốc độ; phát tiếp khi tắt màn hình | P1 |
| **M05** | DS phòng trưng bày | Duyệt hiện vật theo phòng, không cần quét QR | P1 |
| **M06** | Tìm kiếm hiện vật | Tìm theo tên hoặc nhập mã số hiện vật | P2 |
| **M07** | Tải nội dung offline | Tải trước audio và ảnh của cả bảo tàng hoặc từng phòng | P2 |
| **M08** | Lịch sử đã nghe | Lưu các hiện vật đã xem trên máy | P2 |
| **M09** | Yêu thích | Đánh dấu hiện vật để xem lại | P3 |
| **M10** | Phụ đề theo audio | Hiện chữ chạy theo giọng đọc, hỗ trợ người khiếm thính | P3 |
| **M11** | Đánh giá hiện vật | Chấm sao và góp ý sau khi nghe | P3 |

### Web quản trị
| Mã | Chức năng | Mô tả ngắn | Ưu tiên |
| :--- | :--- | :--- | :---: |
| **W01** | Đăng nhập, đăng xuất | Email và mật khẩu, dùng JWT (Supabase Auth) | P1 |
| **W02** | Quản lý phòng | Thêm, sửa, xóa, sắp xếp phòng trưng bày | P1 |
| **W03** | Quản lý hiện vật | Thêm, sửa, xóa, tìm kiếm, lọc theo phòng, tải ảnh | P1 |
| **W04** | Tự động dịch | Nhập bản tiếng Việt, bấm nút để dịch sang các ngôn ngữ | P1 |
| **W05** | Duyệt & sửa bản dịch | Xem song song bản gốc và dịch, sửa tay trước khi xuất bản | P1 |
| **W06** | Tạo audio thuyết minh| Sinh file audio bằng TTS, nghe thử, chọn giọng nam/nữ | P1 |
| **W07** | Tạo và in mã QR | Sinh QR cho từng hiện vật, tải về dạng PNG/PDF để in | P1 |
| **W08** | Quản lý ngôn ngữ | Bật hoặc tắt ngôn ngữ hỗ trợ | P2 |
| **W09** | Thống kê | Lượt quét, lượt nghe theo hiện vật, ngôn ngữ và ngày | P2 |
| **W10** | Quản lý tài khoản | Thêm tài khoản nhân viên, phân quyền | P3 |

---

## Bước 1.3: Phạm vi và Yêu cầu phi chức năng
*   **Trong phạm vi đồ án:** Toàn bộ chức năng `P1` và `P2` ở trên, cho 1 bảo tàng, dữ liệu mẫu ~20 hiện vật trong 3-4 phòng.
*   **Ngoài phạm vi:** Thanh toán vé, nhiều bảo tàng, định vị trong nhà (beacon BLE), chatbot, AR. (Ghi vào phần hướng phát triển).

| Nhóm | Yêu cầu |
| :--- | :--- |
| **Hiệu năng** | Quét QR đến phát audio < 3s (có mạng), < 1s (offline). |
| **Đa ngôn ngữ**| Toàn bộ text UI dùng file dịch `i18n`, không hardcode; dễ dàng thêm ngôn ngữ mới. |
| **Offline** | App vẫn xem và nghe được nội dung đã tải khi mất mạng. |
| **Tương thích** | Android 10+, iOS 15+; Web chạy trên Chrome, Edge, Firefox bản mới. |
| **Dễ dùng** | Trải nghiệm tự nhiên (không cần hướng dẫn), chữ to, hỗ trợ trình đọc màn hình. |
| **Bảo mật** | Web admin yêu cầu đăng nhập, pass mã hóa. **Chỉ tài khoản quản trị được ghi dữ liệu (Supabase Row Level Security - RLS).** |
| **Bảo trì** | Code có lint, test tự động; CI/CD check trước khi merge PR. |

---

## Bước 2.1: Danh sách Use Case

| Mã | Use case | Tác nhân | Chức năng liên quan |
| :--- | :--- | :--- | :--- |
| **UC01** | Chọn ngôn ngữ | Khách | M01 |
| **UC02** | Quét QR hiện vật | Khách | M02 |
| **UC03** | Xem chi tiết hiện vật | Khách | M03, M05, M06 |
| **UC04** | Nghe thuyết minh | Khách | M04, M10 |
| **UC05** | Tải nội dung offline | Khách | M07 |
| **UC06** | Xem lịch sử và yêu thích | Khách | M08, M09 |
| **UC07** | Đăng nhập | Quản trị viên | W01 |
| **UC08** | Quản lý phòng trưng bày | Quản trị viên | W02 |
| **UC09** | Quản lý hiện vật | Quản trị viên | W03 |
| **UC10** | Dịch tự động & duyệt bản dịch| Quản trị viên, DV Dịch máy | W04, W05 |
| **UC11** | Tạo audio thuyết minh | Quản trị viên, DV TTS | W06 |
| **UC12** | Tạo và in mã QR | Quản trị viên | W07 |
| **UC13** | Xem thống kê | Quản trị viên | W09 |

> **Ghi chú UML:** `UC02` include `UC03` (quét xong mở chi tiết); `UC04` extend `UC03` (khách có thể nghe hoặc không); `UC08`->`UC13` include `UC07` (phải đăng nhập); `UC11` include `UC10` (cần dịch trước khi tạo audio).

---

## Bước 2.2: Đặc tả Use Case chính

### UC02: Quét QR hiện vật
*   **Tác nhân:** Khách tham quan
*   **Mô tả:** Khách quét mã QR cạnh hiện vật để mở trang thuyết minh.
*   **Tiền điều kiện:** App đã cài, đã chọn ngôn ngữ, đã cấp quyền camera.
*   **Luồng chính:**
    1. Khách bấm nút Quét QR.
    2. App mở camera.
    3. Khách đưa camera vào mã.
    4. App đọc mã, gọi API lấy nội dung theo ngôn ngữ.
    5. App mở trang chi tiết hiện vật (UC03).
*   **Luồng thay thế:**
    *   `2a.` Từ chối camera: Hướng dẫn cấp quyền / cho nhập mã thủ công.
    *   `4a.` Mã không hợp lệ: Báo lỗi "Mã không hợp lệ".
    *   `4b.` Mất mạng: Lấy nội dung offline. Nếu chưa tải, báo cần kết nối.
    *   `4c.` Chưa có bản dịch ngôn ngữ đó: Hiện tiếng Anh kèm thông báo.
*   **Hậu điều kiện:** Trang chi tiết được mở, lượt quét được ghi nhận để thống kê.

### UC04: Nghe thuyết minh
*   **Tác nhân:** Khách tham quan
*   **Tiền điều kiện:** Đang ở trang chi tiết hiện vật.
*   **Luồng chính:**
    1. Khách bấm Phát.
    2. App tải
