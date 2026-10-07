Phân tích yêu cầu: Hệ thống thuyết minh bảo tàng đa ngôn ngữ
Oct 7, 2026 · @HUy
Tổng quan
Hệ thống giúp khách tham quan bảo tàng nghe thuyết minh hiện vật bằng ngôn ngữ của mình, chỉ cần quét mã QR đặt cạnh hiện vật. Quản trị viên chỉ nhập nội dung tiếng Việt một lần, hệ thống tự dịch và tạo file âm thanh cho các ngôn ngữ còn lại.
Hệ thống gồm 3 phần:
•	App mobile cho khách (React Native + Expo): quét QR, nghe thuyết minh, dùng được khi không có mạng.
•	Web quản trị (React.js): quản lý hiện vật, nội dung, mã QR và thống kê.
•	Backend + dịch vụ AI (nhóm BE phụ trách): API, cơ sở dữ liệu, dịch máy, chuyển văn bản thành giọng nói (TTS).
Mục tiêu đo được cho bản demo: hỗ trợ tối thiểu 4 ngôn ngữ (Việt, Anh, Trung, Hàn), có ít nhất 20 hiện vật mẫu, và từ lúc quét QR đến lúc phát audio dưới 3 giây khi có mạng.
Bước 1.1: Tác nhân
Hệ thống có 2 tác nhân là người và 2 tác nhân là hệ thống ngoài.
Tác nhân	Loại	Mô tả	Dùng phần nào
Khách tham quan	Người	Khách trong nước và quốc tế, không cần đăng nhập	App mobile
Quản trị viên bảo tàng	Người	Nhân viên nhập nội dung, quản lý hiện vật, xem thống kê	Web quản trị
Dịch vụ dịch máy	Hệ thống ngoài	Google Translate API, DeepL hoặc LLM	Backend gọi
Dịch vụ TTS	Hệ thống ngoài	Google Cloud TTS hoặc Azure Speech	Backend gọi
Có thể mở rộng thêm vai trò Super Admin (quản lý tài khoản nhân viên) nếu giảng viên yêu cầu phân quyền.
Bước 1.2: Danh sách chức năng
Độ ưu tiên: P1 = bắt buộc cho bản demo, P2 = nên có, P3 = làm nếu còn thời gian.
App mobile (khách tham quan)
Mã	Chức năng	Mô tả ngắn	Ưu tiên
M01	Chọn ngôn ngữ	Lần đầu mở app tự nhận ngôn ngữ máy, cho đổi trong cài đặt	P1
M02	Quét QR hiện vật	Mở camera, quét mã và chuyển tới trang hiện vật	P1
M03	Xem chi tiết hiện vật	Ảnh, tên, niên đại, mô tả theo ngôn ngữ đã chọn	P1
M04	Nghe thuyết minh	Phát, dừng, tua, đổi tốc độ; phát tiếp khi tắt màn hình	P1
M05	Danh sách phòng trưng bày	Duyệt hiện vật theo phòng, không cần quét QR	P1
M06	Tìm kiếm hiện vật	Tìm theo tên hoặc nhập mã số hiện vật	P2
M07	Tải nội dung offline	Tải trước audio và ảnh của cả bảo tàng hoặc từng phòng	P2
M08	Lịch sử đã nghe	Lưu các hiện vật đã xem trên máy	P2
M09	Yêu thích	Đánh dấu hiện vật để xem lại	P3
M10	Phụ đề theo audio	Hiện chữ chạy theo giọng đọc, hỗ trợ người khiếm thính	P3
M11	Đánh giá hiện vật	Chấm sao và góp ý sau khi nghe	P3
Web quản trị
Mã	Chức năng	Mô tả ngắn	Ưu tiên
W01	Đăng nhập, đăng xuất	Email và mật khẩu, dùng JWT	P1
W02	Quản lý phòng trưng bày	Thêm, sửa, xóa, sắp xếp phòng	P1
W03	Quản lý hiện vật	Thêm, sửa, xóa, tìm kiếm, lọc theo phòng, tải ảnh	P1
W04	Tự động dịch nội dung	Nhập bản tiếng Việt, bấm nút để dịch sang các ngôn ngữ	P1
W05	Duyệt và sửa bản dịch	Xem song song bản gốc và bản dịch, sửa tay trước khi xuất bản	P1
W06	Tạo audio thuyết minh	Sinh file audio bằng TTS, nghe thử, chọn giọng nam hoặc nữ	P1
W07	Tạo và in mã QR	Sinh QR cho từng hiện vật, tải về dạng PNG hoặc PDF để in	P1
W08	Quản lý ngôn ngữ	Bật hoặc tắt ngôn ngữ hỗ trợ	P2
W09	Thống kê	Lượt quét, lượt nghe theo hiện vật, ngôn ngữ và ngày	P2
W10	Quản lý tài khoản nhân viên	Thêm tài khoản, phân quyền	P3
Bước 1.3: Phạm vi và yêu cầu phi chức năng
Trong phạm vi đồ án: toàn bộ chức năng P1 và P2 ở trên, cho một bảo tàng, dữ liệu mẫu khoảng 20 hiện vật trong 3 đến 4 phòng.
Ngoài phạm vi: thanh toán vé, nhiều bảo tàng trên cùng hệ thống, định vị trong nhà bằng beacon BLE, chatbot hỏi đáp, thực tế tăng cường (AR). Các mục này có thể ghi vào phần hướng phát triển của báo cáo.
Nhóm	Yêu cầu
Hiệu năng	Từ lúc quét QR đến lúc phát audio dưới 3 giây khi có mạng, dưới 1 giây khi đã tải offline
Đa ngôn ngữ	Toàn bộ chữ trên giao diện nằm trong file dịch i18n, không viết cứng; thêm ngôn ngữ mới không cần sửa code
Offline	App vẫn xem và nghe được nội dung đã tải khi mất mạng
Tương thích	Android 10 trở lên, iOS 15 trở lên; web chạy trên Chrome, Edge, Firefox bản mới
Dễ dùng	Khách dùng được không cần hướng dẫn; chữ cỡ lớn, hỗ trợ trình đọc màn hình
Bảo mật	Web quản trị yêu cầu đăng nhập, mật khẩu được mã hóa, API quản trị kiểm tra token
Bảo trì	Code có lint, test tự động; mỗi pull request phải qua CI trước khi gộp
Bước 2.1: Danh sách use case
Mỗi use case ứng với một hoặc vài chức năng ở bước 1.2. Sơ đồ use case nằm ngay dưới bảng.
Mã	Use case	Tác nhân	Chức năng liên quan
UC01	Chọn ngôn ngữ	Khách	M01
UC02	Quét QR hiện vật	Khách	M02
UC03	Xem chi tiết hiện vật	Khách	M03, M05, M06
UC04	Nghe thuyết minh	Khách	M04, M10
UC05	Tải nội dung offline	Khách	M07
UC06	Xem lịch sử và yêu thích	Khách	M08, M09
UC07	Đăng nhập	Quản trị viên	W01
UC08	Quản lý phòng trưng bày	Quản trị viên	W02
UC09	Quản lý hiện vật	Quản trị viên	W03
UC10	Dịch tự động và duyệt bản dịch	Quản trị viên, Dịch vụ dịch máy	W04, W05
UC11	Tạo audio thuyết minh	Quản trị viên, Dịch vụ TTS	W06
UC12	Tạo và in mã QR	Quản trị viên	W07
UC13	Xem thống kê	Quản trị viên	W09
Quan hệ cần vẽ trên sơ đồ UML: UC02 include UC03 (quét xong luôn mở chi tiết), UC04 extend UC03 (khách có thể bấm nghe hoặc không), UC08 đến UC13 đều include UC07 (phải đăng nhập), UC11 include UC10 (cần bản dịch trước khi tạo audio).
[embed: node/52916499-004d]
Sơ đồ chỉ vẽ quan hệ giữa tác nhân và use case; các quan hệ include, extend ở đoạn trên cần vẽ thêm khi làm bản UML chính thức.
Bước 2.2: Đặc tả use case chính
Dưới đây là 4 use case quan trọng nhất, viết theo mẫu chuẩn. Các use case còn lại viết theo cùng mẫu.
UC02: Quét QR hiện vật
Mục	Nội dung
Tác nhân	Khách tham quan
Mô tả	Khách quét mã QR cạnh hiện vật để mở trang thuyết minh
Tiền điều kiện	App đã cài, khách đã chọn ngôn ngữ, đã cấp quyền camera
Luồng chính	1. Khách bấm nút Quét QR. 2. App mở camera. 3. Khách đưa camera vào mã. 4. App đọc mã hiện vật và gọi API lấy nội dung theo ngôn ngữ đã chọn. 5. App mở trang chi tiết hiện vật (UC03).
Luồng thay thế	2a. Khách từ chối quyền camera: app hiện hướng dẫn cấp quyền và ô nhập mã số thủ công. 4a. Mã không thuộc bảo tàng: báo "Mã không hợp lệ". 4b. Mất mạng: lấy nội dung đã tải offline, nếu chưa tải thì báo cần kết nối. 4c. Hiện vật chưa có bản dịch ngôn ngữ đó: hiển thị tiếng Anh kèm thông báo.
Hậu điều kiện	Trang chi tiết được mở, lượt quét được ghi lại để thống kê
UC04: Nghe thuyết minh
Mục	Nội dung
Tác nhân	Khách tham quan
Tiền điều kiện	Đang ở trang chi tiết hiện vật
Luồng chính	1. Khách bấm Phát. 2. App tải hoặc lấy file audio theo ngôn ngữ. 3. App phát audio, hiện thanh tiến độ. 4. Khách có thể dừng, tua, đổi tốc độ 0.75x đến 1.5x. 5. Audio phát hết, app ghi lượt nghe.
Luồng thay thế	2a. Chưa có file audio: app dùng TTS có sẵn trên máy để đọc phần mô tả. 3a. Khách khóa màn hình: audio vẫn phát, có nút điều khiển trên màn hình khóa. 3b. Khách quét hiện vật khác: dừng audio cũ.
Hậu điều kiện	Hiện vật được thêm vào lịch sử đã nghe
UC10: Dịch tự động và duyệt bản dịch
Mục	Nội dung
Tác nhân	Quản trị viên, Dịch vụ dịch máy
Tiền điều kiện	Đã đăng nhập, hiện vật đã có nội dung tiếng Việt
Luồng chính	1. Quản trị viên mở hiện vật, bấm Dịch tự động. 2. Chọn các ngôn ngữ cần dịch. 3. Hệ thống gọi dịch vụ dịch máy, lưu bản dịch ở trạng thái Nháp. 4. Web hiện bản gốc và bản dịch cạnh nhau. 5. Quản trị viên sửa nếu cần và bấm Duyệt. 6. Bản dịch chuyển sang trạng thái Đã duyệt.
Luồng thay thế	3a. Dịch vụ lỗi hoặc hết hạn mức: báo lỗi, cho phép thử lại hoặc nhập tay. 5a. Sửa bản gốc tiếng Việt sau khi đã dịch: các bản dịch bị đánh dấu Cần cập nhật.
Hậu điều kiện	Bản dịch đã duyệt hiển thị trên app
UC11: Tạo audio thuyết minh
Mục	Nội dung
Tác nhân	Quản trị viên, Dịch vụ TTS
Tiền điều kiện	Bản dịch của ngôn ngữ đó đã duyệt
Luồng chính	1. Quản trị viên bấm Tạo audio, chọn giọng đọc. 2. Hệ thống gửi văn bản tới dịch vụ TTS. 3. Lưu file MP3 lên kho lưu trữ. 4. Web hiện trình phát để nghe thử. 5. Quản trị viên bấm Xuất bản.
Luồng thay thế	2a. TTS lỗi: báo lỗi, cho thử lại. 4a. Phát âm sai tên riêng: quản trị viên sửa văn bản hoặc tải lên file thu âm thật.
Hậu điều kiện	App khách phát được audio mới
Bước 2.3: User story
Mẫu: Là [ai], tôi muốn [làm gì] để [được gì]. Mỗi story có tiêu chí chấp nhận (AC) để biết khi nào làm xong. Điểm story (SP) theo thang 1, 2, 3, 5, 8 dùng để chia sprint.
Mã	User story	Tiêu chí chấp nhận	SP	Sprint
US01	Là quản trị viên, tôi muốn đăng nhập để chỉ nhân viên được sửa nội dung	Sai mật khẩu báo lỗi; đúng thì vào dashboard; chưa đăng nhập mà vào trang quản trị thì bị chuyển về trang đăng nhập	3	1
US02	Là quản trị viên, tôi muốn thêm, sửa, xóa phòng trưng bày để sắp xếp hiện vật theo khu	Tên phòng bắt buộc; xóa phòng còn hiện vật thì hỏi xác nhận	3	1
US03	Là quản trị viên, tôi muốn thêm hiện vật kèm ảnh và mô tả tiếng Việt để khách xem được	Form kiểm tra dữ liệu; ảnh tối đa 5 MB; danh sách có tìm kiếm, lọc theo phòng, phân trang	5	1
US04	Là quản trị viên, tôi muốn bấm một nút để dịch mô tả sang các ngôn ngữ để không phải dịch tay	Hiện bản gốc và bản dịch cạnh nhau; sửa được; chỉ bản Đã duyệt hiện trên app	5	1
US05	Là quản trị viên, tôi muốn tạo audio từ bản dịch để không phải thu âm	Chọn giọng; nghe thử trên web; có trạng thái đang tạo, xong, lỗi	5	2
US06	Là quản trị viên, tôi muốn tải mã QR của hiện vật để in và dán	Tải PNG từng cái; in hàng loạt theo phòng ra PDF, dưới mã có tên hiện vật	3	2
US07	Là khách, tôi muốn app hiển thị bằng ngôn ngữ của tôi để hiểu được	Lần đầu tự nhận ngôn ngữ máy; đổi trong cài đặt thì cả giao diện và nội dung đổi ngay; nhớ lựa chọn khi mở lại	3	2
US08	Là khách, tôi muốn quét QR để mở ngay hiện vật trước mặt	Mở được trong dưới 3 giây; mã sai báo lỗi; có ô nhập mã số thay thế	5	2
US09	Là khách, tôi muốn nghe thuyết minh và tắt màn hình để vừa đi vừa nghe	Phát, dừng, tua, đổi tốc độ; phát tiếp khi khóa màn hình	5	2
US10	Là khách, tôi muốn duyệt hiện vật theo phòng để không cần quét	Danh sách phòng, bấm vào ra danh sách hiện vật có ảnh nhỏ	3	2
US11	Là khách, tôi muốn tải trước nội dung để nghe khi bảo tàng yếu sóng	Hiện dung lượng trước khi tải; có thanh tiến độ; mất mạng vẫn mở và nghe được	8	3
US12	Là khách, tôi muốn xem lại các hiện vật đã nghe để ôn lại sau chuyến tham quan	Danh sách theo thời gian, mới nhất trước; lưu trên máy	2	3
US13	Là quản trị viên, tôi muốn xem hiện vật nào được nghe nhiều nhất và bằng ngôn ngữ nào để biết khách quan tâm gì	Biểu đồ lượt nghe theo ngày; top 10 hiện vật; tỉ lệ theo ngôn ngữ; lọc theo khoảng ngày	5	3
US14	Là thành viên nhóm, tôi muốn mỗi pull request tự chạy kiểm tra và deploy để không đưa lỗi lên nhánh chính	GitHub Actions chạy lint, test; web có bản preview trên Vercel; build APK bằng EAS khi gộp vào main	5	1
Bước 2.4: Dữ liệu và API cần thống nhất với BE
FE cần chốt danh sách này với bạn làm BE trước khi code, ghi vào Swagger hoặc Postman để FE dùng dữ liệu giả (mock) trong lúc chờ.
Các bảng dữ liệu chính
Bảng	Trường chính
users	id, email, password_hash, name, role
languages	code (vi, en, zh, ko), name, is_active
rooms	id, order, image_url
room_translations	room_id, lang_code, name, description
exhibits	id, room_id, code (mã số in trên QR), image_url, year, created_at
exhibit_translations	exhibit_id, lang_code, title, description, status (draft, approved, outdated), audio_url, voice
visit_events	id, exhibit_id, lang_code, type (scan, play, complete), device_id, created_at
API cho app khách (không cần đăng nhập)
Phương thức	Đường dẫn	Mục đích
GET	/api/languages	Danh sách ngôn ngữ đang bật
GET	/api/rooms?lang=en	Danh sách phòng theo ngôn ngữ
GET	/api/rooms/:id/exhibits?lang=en	Hiện vật trong phòng
GET	/api/exhibits/by-code/:code?lang=en	Lấy hiện vật khi quét QR
GET	/api/exhibits/search?q=...&lang=en	Tìm kiếm
GET	/api/offline-package?lang=en	Danh sách toàn bộ nội dung và link audio để tải offline
POST	/api/events	Ghi lượt quét, nghe
API cho web quản trị (cần token)
Phương thức	Đường dẫn	Mục đích
POST	/api/auth/login	Đăng nhập, trả về JWT
GET, POST, PUT, DELETE	/api/admin/rooms	Quản lý phòng
GET, POST, PUT, DELETE	/api/admin/exhibits	Quản lý hiện vật
POST	/api/admin/upload	Tải ảnh lên
POST	/api/admin/exhibits/:id/translate	Dịch tự động, body chứa danh sách ngôn ngữ
PUT	/api/admin/exhibits/:id/translations/:lang	Sửa và duyệt bản dịch
POST	/api/admin/exhibits/:id/translations/:lang/tts	Tạo audio
GET	/api/admin/exhibits/:id/qr	Tải ảnh QR
GET	/api/admin/stats?from=...&to=...	Số liệu thống kê
Nội dung QR nên là một đường link dạng https://<tên-miền>/e/<mã>. Khi khách quét bằng camera thường mà chưa cài app, link này vẫn mở được trang web công khai của hiện vật.

