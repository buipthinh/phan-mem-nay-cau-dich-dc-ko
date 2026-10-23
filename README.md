PRD - App thuyết minh tự động đa ngôn ngữ lễ hội Mùa thu lộng lẫy
Oct 22, 2026 · @HUy
1. Problem Alignment – Vấn đề cần giải quyết
Lễ hội ngoài trời đông khách nhưng hầu hết thông tin chỉ có bằng tiếng Việt. Ban tổ chức lại không có cách nào cập nhật nhanh cho khách đang đi trong lễ hội.
1. Khách thiếu thông tin tại chỗ: đứng giữa lễ hội không biết mình đang ở khu nào, khu đó có gì, nhà vệ sinh hay trạm y tế ở đâu.
2. Rào cản ngôn ngữ: khách nước ngoài không đọc được bảng hiệu, thực đơn, giá và thành phần gây dị ứng bằng tiếng Việt.
3. Hướng dẫn viên đắt và không linh hoạt: phải đi theo đoàn, theo giờ cố định; lễ hội 5 khu, 16 gian thì không đủ người thuyết minh.
4. Dễ lỡ tiết mục: khách không biết giờ diễn, không ai nhắc trước giờ bắt đầu.
5. Nội dung đa ngôn ngữ tốn công: mỗi lần sửa giá hay đổi giờ diễn phải nhờ người dịch lại sang từng thứ tiếng, dễ để bản dịch cũ sai so với bản gốc.
6. Thông báo khẩn khó đến tay khách: trời mưa, đổi giờ diễn, trẻ đi lạc chỉ báo được qua loa, khách nước ngoài không hiểu.
2. High Level Approach – Hướng giải quyết
Giải pháp gồm một app điện thoại cho khách và một web quản trị cho ban tổ chức, dùng chung một gói logic và dữ liệu.
• Xây dựng app mobile bằng React Native (Expo), chạy trên Android và iOS; khách mở bằng Expo Go hoặc cài file APK.
• Tích hợp GPS và geofence: mỗi khu có một vùng tròn, khách bước vào là app tự đọc thuyết minh của khu đó.
• Hỗ trợ 6 ngôn ngữ: Việt, Anh, Trung, Hàn, Nhật, Đức; giọng đọc dùng Text-to-Speech có sẵn trên máy.
• Mỗi gian có mã QR: quét để mở trang gian và nhận tem; hoặc bấm số gian để xem nhanh.
• Ban tổ chức chỉ nhập nội dung tiếng Việt một lần trên web quản trị, bấm "Dịch tự động" rồi duyệt bản dịch trước khi khách thấy.
• Tự động hoá bằng CI/CD trên GitHub Actions: kiểm tra code mỗi lần push, tự đưa web lên GitHub Pages, build app bằng EAS.
3. Narrative – Kịch bản sử dụng
1. Anh Park, du khách Hàn Quốc, mở app lần đầu. Điện thoại để tiếng Hàn nên app gợi ý sẵn tiếng Hàn; anh bấm xác nhận.
2. Vừa qua cổng, chị bước vào quảng trường E. App tự đọc lời chào và bố cục lễ hội bằng tiếng Hàn.
3. Sang khu A, app đọc giới thiệu khu ẩm thực. Chị quét mã QR ở gian F1, thấy bánh trung thu có trứng, gluten và hạt, và nhận tem đầu tiên.
4. Chị mở Lịch diễn, bấm "Nhắc tôi" cho đêm nhạc rước đèn 19:30. Đúng 19:15 điện thoại báo để chị đi về sân khấu.
5. Đi đủ 8 gian, chị ra gian T4, đưa màn hình săn tem cho nhân viên và nhận đèn lồng mini.
4. Goals – Mục tiêu
Cung cấp trải nghiệm thuyết minh tự động cho khách tham quan lễ hội Mùa thu lộng lẫy (21–22/11/2026, 5 khu, 16 gian hàng, 4 suất diễn mỗi ngày).
Dùng GPS để tự phát nội dung đúng với khu khách đang đứng, khách không cần bấm gì.
Hỗ trợ 6 ngôn ngữ, thân thiện với khách quốc tế và khách tự túc (không cần hướng dẫn viên); ban tổ chức cập nhật nội dung và thông báo trong vài phút.
5. Solution Alignment – Giải pháp
Đây là hệ thống thuyết minh tự động cho lễ hội ngoài trời Mùa thu lộng lẫy: khách đi bộ vào khu nào, điện thoại tự đọc giới thiệu khu đó bằng ngôn ngữ khách chọn. Ban tổ chức quản lý nội dung trên web quản trị; hai ứng dụng dùng chung một gói logic.
Nét đứt là phần đã thiết kế nhưng chưa nối: bản demo hiện chạy bằng dữ liệu mẫu trong gói dùng chung.
Key Features
1. Bản đồ + GPS: bản đồ lễ hội vẽ sẵn trong app (5 khu, 16 gian, tiện ích); geofence tự đọc thuyết minh khi khách vào khu.
2. 6 ngôn ngữ: Việt, Anh, Trung, Hàn, Nhật, Đức cho cả chữ trên giao diện và giọng đọc; thiếu bản dịch thì dùng tiếng Anh kèm ghi chú.
3. QR ở gian hàng: quét để mở trang gian (mô tả, giá, thành phần dị ứng) và nhận tem; bấm số gian để xem mà không nhận tem.
4. Lịch diễn + nhắc giờ: 4 suất diễn mỗi ngày tại sân khấu Trăng Thu, nhắc trước 15 phút theo giờ Việt Nam.
5. Săn tem đổi quà: quét đủ 8 gian khác nhau thì đổi đèn lồng mini tại gian T4.
6. Web quản trị: sửa khu và vùng GPS, quản lý gian hàng, dịch tự động và duyệt bản dịch, sửa lịch diễn, in mã QR, xem thống kê.
7. Thông báo khẩn: ban tổ chức phát một dòng thông báo hiện ở đầu app của mọi khách.
Mức độ giải quyết các vấn đề
Cả 6 khó khăn đều có giải pháp chạy được trên bản demo; phần còn thiếu là nối back end Supabase thật và thử GPS tại địa điểm thật.
Khó khăn
Giải pháp trong hệ thống
Mức độ
1. Thiếu thông tin tại chỗ
GPS + geofence tự đọc thuyết minh; bản đồ có khu, gian, tiện ích
Đã có; chưa thử ở lễ hội thật, demo bằng cách chạm vào khu để giả lập vị trí
2. Rào cản ngôn ngữ
6 ngôn ngữ cho giao diện và giọng đọc; gợi ý theo ngôn ngữ của máy
Đã có; lời thuyết minh dài mới đủ tiếng Việt và Anh, 4 ngôn ngữ còn lại đọc bản tiếng Anh
3. Hướng dẫn viên đắt
Khách tự đi, tự nghe bằng điện thoại của mình
Đã có
4. Dễ lỡ tiết mục
Lịch diễn, nút "Nhắc tôi" trước 15 phút
Đã có
5. Nội dung đa ngôn ngữ tốn công
Dịch tự động, duyệt bản dịch; sửa bản gốc thì bản dịch chuyển thành "Cần dịch lại"
Một phần: chưa đặt khóa Google Translate thì web dùng bản dịch nháp giả để demo
6. Thông báo khẩn khó đến tay khách
Trang Thông báo trên web, hiện ở đầu app
Một phần: cần nối Supabase để thông báo từ web tới được app của khách
Cải tiến so với cách cũ
Cải tiến lớn nhất là thuyết minh tự kích hoạt theo vị trí và bằng ngôn ngữ của khách, thay cho tờ rơi, loa phát thanh và hướng dẫn viên.
So với cách cũ (tờ rơi, bảng chỉ dẫn, loa, hướng dẫn viên):
• Rảnh tay: khách không phải bấm, đi tới khu nào là nghe khu đó.
• Dùng được khi sóng yếu: bản đồ và dữ liệu có sẵn trong app, giọng đọc dùng giọng của máy.
• Nội dung cập nhật nhanh: sửa tiếng Việt một lần, hệ thống dịch và báo bản dịch nào đã cũ.
• Không đọc sai thông tin: bản dịch phải được duyệt mới tới tay khách.
6. Business context – Ngữ cảnh nghiệp vụ
Hệ thống có 7 nghiệp vụ: Thuyết minh theo vị trí, Tra cứu lễ hội, Lịch diễn, Săn tem, Nội dung đa ngôn ngữ, Thông báo và thống kê và Phân quyền truy cập.
• Thuyết minh theo vị trí: khi khách đi vào vùng GPS của một khu, app tự đọc thuyết minh của khu (nếu đã bật tự đọc) và hiện thẻ khu. Khách đổi ngôn ngữ, tốc độ đọc bất cứ lúc nào trong Cài đặt.
• Tra cứu lễ hội: khách xem bản đồ, danh sách 16 gian theo khu, chi tiết gian (mô tả, giá, dị ứng); mở gian bằng QR hoặc bấm số gian.
• Lịch diễn: khách xem 4 suất diễn mỗi ngày và đặt nhắc trước 15 phút. Ban tổ chức sửa giờ, tên và mô tả suất diễn.
• Săn tem: mỗi lần quét QR ở một gian mới được 1 tem; đủ 8 tem thì đổi quà tại gian T4.
• Nội dung đa ngôn ngữ: ban tổ chức nhập tiếng Việt, bấm "Dịch tự động", sửa rồi bấm "Duyệt". Chỉ bản đã duyệt mới tới khách; sửa bản gốc thì bản dịch chuyển thành "Cần dịch lại".
• Thông báo và thống kê: ban tổ chức phát thông báo khẩn, in mã QR, xem lượt quét, lượt nghe, ngôn ngữ khách dùng và gian được quét nhiều nhất.
• Phân quyền truy cập: ban tổ chức đăng nhập web bằng email và mật khẩu. Khách không cần tài khoản: mở app là dùng được, chỉ đọc nội dung đã duyệt.
Hệ thống bên ngoài: GPS của điện thoại, giọng đọc Text-to-Speech của máy, camera (quét QR), thông báo của hệ điều hành, Google Translate (dịch), Supabase (cơ sở dữ liệu, đăng nhập), GitHub Actions và Expo EAS (CI/CD).
7. Conceptual model
Mô hình khái niệm gồm 7 bảng trên Supabase. Mọi chữ hiển thị cho khách nằm chung trong bảng translations, nên thêm ngôn ngữ mới chỉ cần thêm một dòng vào languages, không sửa cấu trúc bảng.
Quan hệ
Bội số
Ý nghĩa
Khu (zones) – Gian hàng (stalls)
1 – n
Mỗi gian thuộc một khu qua cột zone_id
Khu – Bản dịch (translations)
1 – n
Mỗi trường (tên, nhãn, thuyết minh) mỗi ngôn ngữ một dòng
Gian hàng – Bản dịch
1 – n
Tên, mô tả, giá, dị ứng theo từng ngôn ngữ
Suất diễn (shows) – Bản dịch
1 – n
Tên và mô tả suất diễn theo từng ngôn ngữ
Ngôn ngữ (languages) – Bản dịch
1 – n
6 ngôn ngữ: vi, en, zh, ko, ja, de
Bản dịch – Trạng thái
n – 1
Bản nháp, Đã duyệt, Cần dịch lại
Khu hoặc Gian – Lượt ghé (visit_events)
1 – n
Mỗi lượt quét QR, nghe, vào khu ghi một dòng kèm ngôn ngữ
Thông báo (announcements)
độc lập
Nội dung tiếng Việt, bật hoặc tắt
Khóa chính của translations gồm 4 cột (loại đối tượng, mã, trường, ngôn ngữ), nên mỗi nội dung có đúng một bản dịch cho mỗi ngôn ngữ.
8. User Story
• US01 – Là khách tham quan, tôi muốn chọn ngôn ngữ của mình (gợi ý sẵn theo ngôn ngữ máy) để đọc và nghe mọi thứ bằng tiếng mình hiểu. (UC01)
• US02 – Là khách tham quan, tôi muốn xem bản đồ lễ hội và biết mình đang đứng ở khu nào. (UC02)
• US03 – Là khách tham quan, tôi muốn nghe thuyết minh tự phát khi vào một khu để không phải cầm điện thoại bấm. (UC03)
• US04 – Là khách tham quan, tôi muốn quét QR hoặc bấm số gian để mở ngay trang gian hàng đang đứng trước mặt. (UC04)
• US05 – Là khách tham quan, tôi muốn xem giá và thành phần gây dị ứng của món ăn trước khi mua. (UC05)
• US06 – Là khách tham quan, tôi muốn được nhắc trước giờ diễn 15 phút để không lỡ tiết mục. (UC06)
• US07 – Là khách tham quan, tôi muốn săn đủ 8 tem để đổi quà cho chuyến đi thêm vui. (UC07)
• US08 – Là khách tham quan, tôi muốn bật tắt tự đọc và chọn tốc độ đọc. (UC08)
• US09 – Là ban tổ chức, tôi muốn đăng nhập web quản trị để chỉ người có quyền mới sửa được nội dung. (UC09)
• US10 – Là ban tổ chức, tôi muốn xem lượt quét, lượt nghe và ngôn ngữ khách dùng để biết khu nào đông khách. (UC10)
• US11 – Là ban tổ chức, tôi muốn sửa thuyết minh và vùng GPS của từng khu. (UC11)
• US12 – Là ban tổ chức, tôi muốn thêm, sửa, xóa gian hàng. (UC12)
• US13 – Là ban tổ chức, tôi muốn chỉ viết tiếng Việt, phần dịch để hệ thống làm rồi tôi duyệt lại. (UC13)
• US14 – Là ban tổ chức, tôi muốn đổi giờ và nội dung suất diễn khi có thay đổi. (UC14)
• US15 – Là ban tổ chức, tôi muốn in mã QR của tất cả gian để dán tại gian hàng. (UC15)
• US16 – Là ban tổ chức, tôi muốn phát thông báo khẩn (trời mưa, đổi giờ, trẻ đi lạc) tới mọi khách. (UC16)
9. Use case
Hệ thống có 2 actor người (Khách tham quan, Ban tổ chức) và 2 actor hệ thống (Hệ thống GPS, Dịch vụ dịch tự động), với 16 use case.
Nghiệp vụ
Actor
Use case
Thuyết minh theo vị trí
Khách tham quan, Hệ thống GPS
Chọn ngôn ngữ (UC01), nghe thuyết minh tự động khi vào khu (UC03), cài đặt tự đọc và tốc độ đọc (UC08)
Tra cứu lễ hội
Khách tham quan
Xem bản đồ (UC02), quét QR hoặc bấm số gian (UC04), xem danh sách và chi tiết gian hàng (UC05)
Lịch diễn
Khách tham quan
Xem lịch diễn và đặt nhắc giờ (UC06)
Lịch diễn
Ban tổ chức
Quản lý lịch diễn (UC14)
Săn tem
Khách tham quan
Săn tem đổi quà (UC07)
Nội dung đa ngôn ngữ
Ban tổ chức, Dịch vụ dịch tự động
Quản lý khu và thuyết minh (UC11), quản lý gian hàng (UC12), dịch tự động và duyệt bản dịch (UC13)
Thông báo và thống kê
Ban tổ chức
Xem tổng quan thống kê (UC10), in mã QR (UC15), phát thông báo khẩn (UC16)
Phân quyền
Ban tổ chức
Đăng nhập web quản trị (UC09)
 
Các use case của ban tổ chức đều «include» UC09 Đăng nhập web quản trị.
UC01 – Chọn ngôn ngữ
• Actor: Khách tham quan.
• User story: Là khách tham quan, tôi muốn dùng app bằng ngôn ngữ của mình.
• Tiền điều kiện: đã cài app. Hậu điều kiện: ngôn ngữ được lưu trên máy; giao diện, thuyết minh và giọng đọc dùng ngôn ngữ đó.
• Luồng chính:
    1. Khách mở app lần đầu.
    2. Hệ thống đọc ngôn ngữ của điện thoại và gợi ý ngôn ngữ đầu tiên được hỗ trợ (1 trong 6).
    3. Khách giữ hoặc chọn ngôn ngữ khác, bấm "Tiếp tục".
    4. Hệ thống lưu lựa chọn, đổi toàn bộ chữ trên giao diện và mở màn hình Bản đồ.
• Luồng thay thế: A1 khách đổi ngôn ngữ sau này trong Cài đặt.
• Ngoại lệ: E1 điện thoại dùng ngôn ngữ không hỗ trợ → gợi ý tiếng Anh.
 
UC02 – Xem bản đồ lễ hội
• Actor: Khách tham quan.
• User story: Là khách tham quan, tôi muốn biết mình đang đứng ở khu nào và xung quanh có gì.
• Tiền điều kiện: đã chọn ngôn ngữ. Hậu điều kiện: khách thấy khu hiện tại và nút "Nghe thuyết minh".
• Luồng chính:
    1. Khách mở tab Bản đồ.
    2. Hệ thống vẽ 5 khu, 16 gian, cổng vào, nhà vệ sinh, điểm y tế, quầy thông tin.
    3. Hệ thống lấy vị trí và hiện "Bạn đang ở" kèm tên khu.
    4. Khách chạm vào một khu; hệ thống hiện tên khu và nút "Nghe thuyết minh".
• Luồng thay thế: A1 khách đứng ngoài các khu → hiện "Bạn đang ở ngoài các khu". A2 có thông báo khẩn → hiện dải thông báo ở đầu màn hình (cần nối Supabase, bản demo chưa có).
• Ngoại lệ: E1 GPS chưa bật hoặc bị từ chối → chuyển sang giả lập vị trí bằng cách chạm vào khu.
 
UC03 – Nghe thuyết minh tự động khi vào khu
• Actor: Khách tham quan; Hệ thống GPS.
• User story: Là khách tham quan, tôi muốn đi tới đâu nghe giới thiệu khu đó mà không phải bấm.
• Tiền điều kiện: đang ở màn hình Bản đồ, cho phép định vị, đã bật "Tự đọc thuyết minh khi vào khu mới". Hậu điều kiện: thuyết minh của khu được đọc một lần; còn đứng trong khu thì không đọc lại.
• Luồng chính:
    1. Hệ thống nhận vị trí mới từ GPS (mỗi 3 giây hoặc mỗi 3 m).
    2. Hệ thống tính khoảng cách tới tâm từng khu và tìm khu chứa vị trí.
    3. Hai lần đo liên tiếp cùng một khu thì xác nhận khách đã vào khu mới.
    4. Hệ thống lấy thuyết minh theo ngôn ngữ khách chọn, hiện thẻ tên khu và đọc bằng giọng của điện thoại.
• Luồng thay thế: A1 khách tắt tự đọc → chỉ hiện thẻ khu, khách tự bấm nghe.
• Ngoại lệ: E1 sai số GPS trên 50 m → bỏ qua lần đo. E2 lần đo thứ hai cho khu khác → chưa đổi khu. E3 chưa có bản dịch → đọc bản tiếng Anh (rồi tiếng Việt) và ghi rõ đang dùng ngôn ngữ nào.
 
UC04 – Quét mã QR hoặc bấm số gian hàng
• Actor: Khách tham quan.
• User story: Là khách tham quan, tôi muốn mở ngay trang của gian đang đứng trước mặt.
• Tiền điều kiện: có camera (khi quét). Hậu điều kiện: mở trang gian; quét QR thì được thêm tem nếu chưa có.
• Luồng chính:
    1. Khách bấm "Quét QR hoặc bấm số gian".
    2. Hệ thống mở camera và hiện lưới 16 số gian bên dưới.
    3. Khách đưa camera vào mã QR; hệ thống đọc mã gian (ví dụ F2) và kiểm tra mã thuộc lễ hội.
    4. Hệ thống cộng 1 tem (UC07), báo "Bạn vừa nhận 1 tem!" và mở trang gian.
• Luồng thay thế: A1 bấm số gian, hoặc A2 gõ mã gian → mở trang gian, không cộng tem.
• Ngoại lệ: E1 từ chối quyền camera → vẫn bấm số gian được. E2 mã không của lễ hội → báo "Mã không hợp lệ". E3 đã có tem gian này → không cộng thêm.
 
UC05 – Xem danh sách và chi tiết gian hàng
• Actor: Khách tham quan.
• User story: Là khách tham quan, tôi muốn xem giá và thành phần dị ứng trước khi mua.
• Tiền điều kiện: đã chọn ngôn ngữ. Hậu điều kiện: khách xem được chi tiết và nghe giới thiệu gian.
• Luồng chính:
    1. Khách mở tab Gian hàng; hệ thống hiện 16 gian chia theo 5 khu.
    2. Khách chọn một gian.
    3. Hệ thống hiện tên, khu, mô tả, giá, thành phần dị ứng theo ngôn ngữ khách chọn.
    4. Khách bấm "Nghe thuyết minh"; hệ thống đọc giới thiệu gian.
• Luồng thay thế: A1 bấm "Dừng" → ngừng đọc.
• Ngoại lệ: E1 chưa có bản dịch → hiện bản thay thế kèm dòng "Chưa có bản dịch, đang hiển thị bằng ...".
 
UC06 – Xem lịch diễn và đặt nhắc giờ
• Actor: Khách tham quan.
• User story: Là khách tham quan, tôi muốn được nhắc trước giờ diễn để không lỡ tiết mục.
• Tiền điều kiện: cho phép thông báo. Hậu điều kiện: các suất chưa diễn có lịch nhắc trước 15 phút.
• Luồng chính:
    1. Khách mở tab Lịch diễn; hệ thống hiện 4 suất và đánh dấu "Đang diễn", "Suất tiếp theo", "Đã kết thúc".
    2. Khách bấm "Nhắc tôi"; hệ thống xin quyền gửi thông báo.
    3. Hệ thống đặt nhắc trước 15 phút theo giờ Việt Nam (UTC+7), nút đổi thành "Đã đặt nhắc".
    4. Đến giờ, điện thoại hiện thông báo.
• Luồng thay thế: A1 mốc nhắc đã qua → bỏ qua suất đó.
• Ngoại lệ: E1 từ chối quyền thông báo → hướng dẫn bật trong Cài đặt của máy.
 
UC07 – Săn tem đổi quà
• Actor: Khách tham quan.
• User story: Là khách tham quan, tôi muốn gom đủ 8 tem để đổi quà.
• Tiền điều kiện: đã quét QR ít nhất một gian. Hậu điều kiện: đủ 8 tem thì nhận đèn lồng mini tại gian T4.
• Luồng chính:
    1. Khách mở tab Săn tem; hệ thống hiện thẻ 8 ô và dòng "Đã có n/8 tem".
    2. Đủ 8 tem, hệ thống báo "Bạn đã đủ tem!".
    3. Khách đưa màn hình cho nhân viên gian T4, nhân viên đối chiếu và trao quà.
• Luồng thay thế: A1 chưa đủ tem → hiện số tem còn thiếu.
• Ngoại lệ: E1 khách xoá dữ liệu app hoặc đổi máy → thẻ tem về 0 (tem chỉ lưu trên máy).
 
UC08 – Cài đặt
• Actor: Khách tham quan.
• User story: Là khách tham quan, tôi muốn bật tắt tự đọc và chọn tốc độ đọc.
• Tiền điều kiện: không có. Hậu điều kiện: cài đặt được lưu và áp dụng cho lần đọc tiếp theo.
• Luồng chính:
    1. Khách mở tab Cài đặt; hệ thống hiện ngôn ngữ, công tắc tự đọc và các mức tốc độ.
    2. Khách bật hoặc tắt tự đọc, chọn tốc độ.
    3. Hệ thống lưu cài đặt trên điện thoại.
• Luồng thay thế: A1 khách đổi ngôn ngữ → thực hiện UC01.
 
UC09 – Đăng nhập web quản trị
• Actor: Ban tổ chức.
• User story: Là ban tổ chức, tôi muốn đăng nhập để chỉ người có quyền mới sửa được nội dung.
• Tiền điều kiện: có tài khoản (bản demo: admin@muathu.vn / muathu2026). Hậu điều kiện: phiên đăng nhập được ghi nhớ, mở trang Tổng quan.
• Luồng chính:
    1. Ban tổ chức mở web quản trị, nhập email và mật khẩu.
    2. Hệ thống kiểm tra thông tin đăng nhập.
    3. Hệ thống ghi nhớ phiên và chuyển tới trang Tổng quan.
• Luồng thay thế: A1 phiên còn hiệu lực → vào thẳng Tổng quan.
• Ngoại lệ: E1 sai email hoặc mật khẩu → báo lỗi dưới ô nhập.
 
UC10 – Xem tổng quan thống kê
• Actor: Ban tổ chức.
• User story: Là ban tổ chức, tôi muốn biết gian nào đông khách và khách dùng ngôn ngữ nào.
• Tiền điều kiện: đã đăng nhập (UC09). Hậu điều kiện: không đổi dữ liệu.
• Luồng chính:
    1. Ban tổ chức mở trang Tổng quan.
    2. Hệ thống tổng hợp lượt quét, lượt nghe và số bản dịch chờ xử lý.
    3. Hệ thống hiện biểu đồ lượt quét theo giờ, tỉ lệ 6 ngôn ngữ và các gian được quét nhiều nhất.
    4. Ban tổ chức bấm tên một gian để mở trang sửa gian.
• Luồng thay thế: A1 còn bản dịch chờ xử lý → bấm đường dẫn để mở trang Gian hàng.
• Ngoại lệ: E1 chưa nối Supabase → dùng số liệu mẫu và ghi rõ đây là dữ liệu demo.
 
UC11 – Quản lý khu và nội dung thuyết minh
• Actor: Ban tổ chức.
• User story: Là ban tổ chức, tôi muốn sửa thuyết minh và vùng GPS của từng khu.
• Tiền điều kiện: đã đăng nhập. Hậu điều kiện: khu được lưu; bản tiếng Việt đổi thì các bản dịch chuyển thành "Cần dịch lại".
• Luồng chính:
    1. Ban tổ chức mở trang Khu và thuyết minh; hệ thống hiện 5 khu trên bản đồ.
    2. Ban tổ chức chọn khu, sửa tên, thuyết minh tiếng Việt, vĩ độ, kinh độ, bán kính.
    3. Ban tổ chức bấm "Nghe thử tiếng Việt"; hệ thống đọc bằng giọng máy.
    4. Hệ thống lưu thay đổi.
• Luồng thay thế: A1 dịch thuyết minh sang ngôn ngữ khác → thực hiện UC13.
• Ngoại lệ: E1 bán kính ngoài khoảng 10–200 m → ô nhập không nhận.
 
UC12 – Quản lý gian hàng
• Actor: Ban tổ chức.
• User story: Là ban tổ chức, tôi muốn thêm, sửa, xóa gian hàng.
• Tiền điều kiện: đã đăng nhập. Hậu điều kiện: gian được lưu; bản tiếng Việt đổi thì các bản dịch chuyển thành "Cần dịch lại".
• Luồng chính:
    1. Ban tổ chức mở trang Gian hàng; hệ thống hiện bảng mã, tên, giá và trạng thái bản dịch (cột EN, ZH, KO, JA, DE).
    2. Ban tổ chức tìm theo mã hoặc tên, lọc theo khu, chọn một gian.
    3. Hệ thống mở trang sửa gian với nội dung tiếng Việt, mã QR và khung bản dịch.
    4. Ban tổ chức sửa tên, mô tả, giá, dị ứng; hệ thống lưu.
• Luồng thay thế: A1 bấm "Gian hàng mới" → tạo gian với mã kế tiếp. A2 xóa gian → xác nhận "Mã QR đã in sẽ không dùng được nữa".
• Ngoại lệ: E1 gian không còn tồn tại → báo "Không tìm thấy gian hàng".
 
UC13 – Dịch tự động và duyệt bản dịch
• Actor: Ban tổ chức; Dịch vụ dịch tự động.
• User story: Là ban tổ chức, tôi muốn chỉ viết tiếng Việt, phần dịch để hệ thống làm.
• Tiền điều kiện: khu hoặc gian có nội dung tiếng Việt. Hậu điều kiện: bản dịch ở trạng thái "Đã duyệt" và được hiển thị cho khách.
• Luồng chính:
    1. Ban tổ chức chọn một trong 5 ngôn ngữ đích (Anh, Trung, Hàn, Nhật, Đức), bấm "Dịch tự động từ tiếng Việt".
    2. Hệ thống gửi nội dung tới dịch vụ dịch, điền kết quả với trạng thái "Bản nháp".
    3. Ban tổ chức đọc, sửa nếu cần, bấm "Duyệt bản dịch".
    4. Hệ thống đổi trạng thái thành "Đã duyệt".
• Luồng thay thế: A1 chưa cấu hình dịch vụ dịch → tạo bản nháp mẫu để demo. A2 sửa bản đã duyệt → về "Bản nháp", phải duyệt lại.
• Ngoại lệ: E1 dịch vụ dịch báo lỗi → hiện lỗi, ban tổ chức tự nhập bản dịch.
 
UC14 – Quản lý lịch diễn
• Actor: Ban tổ chức.
• User story: Là ban tổ chức, tôi muốn đổi giờ và nội dung suất diễn khi có thay đổi.
• Tiền điều kiện: đã đăng nhập. Hậu điều kiện: lịch mới được lưu, nhắc giờ trong app cập nhật theo.
• Luồng chính:
    1. Ban tổ chức mở trang Lịch biểu diễn; hệ thống hiện 4 suất.
    2. Ban tổ chức sửa giờ bắt đầu, giờ kết thúc, tên hoặc mô tả.
    3. Hệ thống lưu lịch mới.
• Ngoại lệ: E1 giờ kết thúc không sau giờ bắt đầu → báo "Phải sau giờ bắt đầu", không lưu.
 
UC15 – In mã QR
• Actor: Ban tổ chức.
• User story: Là ban tổ chức, tôi muốn in mã QR của các gian để dán tại gian hàng.
• Tiền điều kiện: đã đăng nhập, có máy in. Hậu điều kiện: có bản in lưới mã QR.
• Luồng chính:
    1. Ban tổ chức mở trang Mã QR gian hàng.
    2. Hệ thống tạo lưới mã QR, mỗi mã kèm mã gian, tên gian và dòng "Quét để nghe thuyết minh".
    3. Ban tổ chức bấm "In"; hệ thống mở hộp thoại in của trình duyệt.
• Luồng thay thế: A1 lọc theo khu → chỉ in mã các gian trong khu đó.
 
UC16 – Phát thông báo khẩn
• Actor: Ban tổ chức.
• User story: Là ban tổ chức, tôi muốn báo ngay cho mọi khách khi trời mưa, đổi giờ hoặc có trẻ đi lạc.
• Tiền điều kiện: đã đăng nhập. Hậu điều kiện: thông báo ở trạng thái "Đang phát", hiện ở đầu app của khách.
• Luồng chính:
    1. Ban tổ chức mở trang Thông báo cho khách; hệ thống hiện các mẫu có sẵn.
    2. Ban tổ chức chọn mẫu hoặc tự soạn, bấm "Phát thông báo".
    3. Hệ thống đổi trạng thái thành "Đang phát". Khi nối Supabase, app của khách hiện dải thông báo màu (bản demo chưa có phần này trong app).
• Luồng thay thế: A1 sự việc đã qua → bấm "Tắt thông báo".
• Ngoại lệ: E1 nội dung trống → nút "Phát thông báo" không bấm được.
 
10. Key Flows – Các luồng chạy chính
A. Luồng thuyết minh tự động
 
1. App theo dõi GPS bằng expo-location, nhận vị trí mới mỗi 3 giây hoặc mỗi 3 m.
2. Lần đo có sai số trên 50 m bị bỏ qua, tránh đọc nhầm khi GPS nhảy.
3. App tính khoảng cách tới tâm từng khu bằng công thức haversine; vị trí nằm trong bán kính là ở trong khu.
4. Phải có 2 lần đo liên tiếp cùng một khu thì mới xác nhận khách đã vào khu mới.
5. App chọn đoạn thuyết minh theo ngôn ngữ khách chọn (thiếu thì lùi về tiếng Anh, rồi tiếng Việt) và đọc bằng expo-speech.
B. Luồng nội dung đa ngôn ngữ
1. Ban tổ chức sửa nội dung tiếng Việt của khu hoặc gian trên web quản trị.
2. Các bản dịch đã có tự chuyển sang "Cần dịch lại".
3. Bấm "Dịch tự động": web gọi Edge Function translate trên Supabase, hàm này gọi Google Translate. Chưa đặt VITE_TRANSLATE_URL thì web tạo bản nháp giả để demo.
4. Bản dịch về với trạng thái "Bản nháp"; ban tổ chức sửa rồi bấm "Duyệt".
5. Chỉ bản "Đã duyệt" mới tới app của khách; khi nối Supabase, quy tắc này do phân quyền theo dòng (RLS) chặn ngay trong cơ sở dữ liệu.
C. Luồng CI/CD
 
1. Mỗi lần push hoặc mở pull request, ci.yml chạy lint, kiểm tra format, typecheck, 24 test, build web và đóng gói thử app Android.
2. Push lên main có đổi code web: deploy-web.yml build và đưa web quản trị lên GitHub Pages.
3. Push lên main hoặc tag v* có đổi code app: mobile-build.yml build app bằng EAS (main ra APK cài thử, tag ra bản phát hành); chưa có EXPO_TOKEN thì tự bỏ qua.
11. Key Logic – Logic cốt lõi
Năm quy tắc dưới đây quyết định cách hệ thống chạy; tất cả nằm trong gói packages/shared và có test.
1. Chỉ đọc khi vị trí đủ tin cậy. Bỏ lần đo sai số trên 50 m; đổi khu sau 2 lần đo liên tiếp; còn đứng trong khu thì không đọc lại. Vị trí nằm trong nhiều khu thì chọn khu có tâm gần nhất. Lý do: ngoài trời GPS hay nhảy, đọc nhầm khu làm khách bực mình.
2. Thiếu bản dịch thì dùng bản thay thế có ghi chú. Thứ tự thử: ngôn ngữ đã chọn, rồi tiếng Anh, rồi tiếng Việt. App hiện "Chưa có bản dịch, đang hiển thị bằng tiếng Anh" và đọc bằng giọng tiếng Anh. Bản dịch rỗng hoặc chỉ có khoảng trắng coi như chưa có.
3. Sửa bản gốc thì bản dịch thành "Cần dịch lại". Vòng đời: Chưa có → Bản nháp → Đã duyệt → Cần dịch lại. Lý do: khách nước ngoài không đọc phải giá cũ hay giờ cũ.
4. Nhắc giờ theo giờ Việt Nam. Giờ diễn lưu dạng giờ:phút, ghép với ngày lễ hội và múi giờ UTC+7; nhắc trước 15 phút, mốc đã qua bị bỏ. Điện thoại để múi giờ Hàn Quốc vẫn nhắc đúng giờ diễn.
5. Chỉ quét QR mới được tem. Thẻ tem là danh sách mã gian không trùng; quét lại một gian không thêm tem; bấm số gian chỉ để xem. Lý do: khách phải thật sự đến gian hàng mới được tính.
12. Component diagram
Quy tắc chỉ viết một lần trong packages/shared và được test một lần; app và web chỉ lo hiển thị. Bảng dưới liệt kê các giao diện giữa các thành phần.
Giao diện
Bên cung cấp
Bên dùng
Ghi chú
Import TypeScript @mtll/shared
packages/shared
App mobile, web quản trị
Dữ liệu lễ hội, geofence, đa ngôn ngữ, QR, lịch, tem
API của thiết bị (Expo)
Android, iOS
App mobile
GPS, giọng đọc, camera, thông báo, ngôn ngữ máy
AsyncStorage
Điện thoại
App mobile
Lưu ngôn ngữ, cài đặt, tem, lịch nhắc
localStorage (mtll-admin-v2)
Trình duyệt
Web quản trị
Kho dữ liệu của bản demo
REST + Auth của Supabase
Supabase
App, web
Đã thiết kế, chưa nối; RLS phân quyền theo dòng
HTTP POST /functions/v1/translate
Edge Function translate
Web quản trị
Gọi Google Translate; cần secret GOOGLE_TRANSLATE_API_KEY
13. Deployment diagram
Bản demo không cần máy chủ riêng: web quản trị chạy trên GitHub Pages, app chạy trên điện thoại qua Expo Go hoặc file APK. Supabase là bước nối sau.
Node
Chạy gì
Ghi chú
Điện thoại khách
App Expo (Expo Go khi demo, APK từ EAS khi cài)
Dữ liệu và bản đồ có sẵn trong app, dùng được khi sóng yếu
Máy tính ban tổ chức
Trình duyệt mở web quản trị
lethanhhuy06102006.github.io/mua-thu-long-lay
GitHub Pages
File tĩnh của web (React + Vite)
Tự cập nhật mỗi lần push lên main
GitHub Actions
CI, deploy web, build app
3 workflow: ci.yml, deploy-web.yml, mobile-build.yml
Expo EAS
Build file APK và bản phát hành
Cần secret EXPO_TOKEN
Máy dev (khi demo)
Metro bundler (npx expo start)
Điện thoại cùng Wi-Fi, quét QR bằng Expo Go
Supabase (sau này)
Postgres 7 bảng, Auth, Edge Function translate
Chạy 0001_init.sql và 0002_add_ja_de.sql
14. Công nghệ sử dụng
Toàn bộ viết bằng TypeScript trong một monorepo npm workspaces gồm 3 gói: apps/mobile, apps/web, packages/shared.
Tầng
Công nghệ
Dùng để làm gì
Vì sao chọn
Mobile
React Native 0.86 + Expo SDK 57
App cho khách, 8 màn hình
Một code chạy Android và iOS; Expo Go cho demo nhanh
Mobile
expo-location
Theo dõi GPS
Geofence cho từng khu
Mobile
expo-speech
Đọc thuyết minh
Giọng có sẵn trên máy, không tốn server, chạy khi mất mạng
Mobile
expo-camera
Quét QR
Có sẵn trong Expo
Mobile
expo-notifications
Nhắc giờ diễn
Thông báo cục bộ, không cần server
Mobile
expo-localization
Gợi ý ngôn ngữ lần đầu
Đọc ngôn ngữ của máy
Mobile
react-native-svg
Vẽ bản đồ lễ hội
Không cần khóa API bản đồ, hiện khi mất mạng
Mobile
AsyncStorage
Lưu ngôn ngữ, tem, cài đặt
Lưu trên máy, không cần tài khoản
Web
React 19 + Vite 8 + React Router 7
Web quản trị, 8 trang
Build nhanh, ra file tĩnh đưa lên GitHub Pages
Web
qrcode
Tạo mã QR để in
Nhẹ, chạy trong trình duyệt
Dùng chung
TypeScript, kiểu Lang
Một nguồn dữ liệu và logic cho app và web
Thêm ngôn ngữ thì TypeScript báo mọi chỗ còn thiếu
Back end
Supabase (Postgres, Auth, RLS, Edge Functions)
Lưu nội dung, bản dịch, thông báo, lượt ghé
Không phải tự viết back end; phân quyền ngay trong CSDL
Dịch
Google Translate (qua Edge Function)
Dịch tự động từ tiếng Việt
Giữ khóa API ở server, không lộ trên web
Chất lượng
oxlint, Prettier, Vitest
Lint, định dạng, 24 test
Nhanh, chạy giống nhau trên máy và trên CI
CI/CD
GitHub Actions, GitHub Pages, Expo EAS, Dependabot
Kiểm tra, deploy web, build app, cập nhật thư viện
Miễn phí cho repo công khai, gắn sẵn với GitHub
15. Thành phần cần để chạy
Thành phần
Cổng
Bắt buộc?
Thiếu thì sao
Node.js 24 + npm
–
Có
Không chạy được npm install và các lệnh khác
Web quản trị (npm run dev:web)
5173
Có (khi chạy trên máy)
Không mở được web; vẫn xem được bản trên GitHub Pages
Metro bundler (npx expo start trong apps/mobile)
8081
Có (khi demo app)
Điện thoại không tải được app
Expo Go trên điện thoại
–
Có (khi demo)
Phải cài file APK thay thế
Cùng Wi-Fi giữa máy dev và điện thoại
–
Có (khi demo)
Quét QR không vào được; dùng hotspot của điện thoại hoặc --tunnel
GPS, quyền vị trí
–
Tùy chọn
Chạm vào khu trên bản đồ để giả lập vị trí
Giọng đọc của ngôn ngữ đã chọn
–
Tùy chọn
Vẫn đọc chữ, không nghe được; cài thêm trong cài đặt giọng nói của máy
Supabase + GOOGLE_TRANSLATE_API_KEY
–
Tùy chọn
Web dùng dữ liệu trong trình duyệt và bản dịch nháp giả
EXPO_TOKEN trên GitHub
–
Tùy chọn
Workflow build app tự bỏ qua
