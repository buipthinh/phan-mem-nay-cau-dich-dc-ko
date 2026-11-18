IF DB_ID(N'MuaThuLongLay') IS NULL CREATE DATABASE MuaThuLongLay;
GO
USE MuaThuLongLay;
GO

/* Xoá bảng cũ nếu chạy lại script (xoá bảng con trước, bảng cha sau) */
DROP TABLE IF EXISTS glossary_translations, glossary_terms, visit_events, translations, announcements, stalls, shows, zones, languages, staff_users;
GO

/* UC01 Chọn ngôn ngữ: các ngôn ngữ khách được chọn trên web khách. */
CREATE TABLE languages (
  code VARCHAR(5) PRIMARY KEY, -- vi, en, zh, ko, ja, de
  name NVARCHAR(50) NOT NULL,
  is_active BIT NOT NULL DEFAULT 1
);

/* UC02, UC03, UC11: các khu của lễ hội. Toạ độ GPS + bán kính dùng để biết khách đang ở khu nào
và tự đọc thuyết minh; map_x..map_h là vị trí khu trên bản đồ vẽ. */
CREATE TABLE zones (
  id VARCHAR(10) PRIMARY KEY, -- A, B, C, D, E
  kind VARCHAR(10) NOT NULL CHECK (kind IN ('food','game','craft','stage','plaza')),
  center_lat FLOAT NOT NULL, -- toạ độ GPS tâm khu
  center_lng FLOAT NOT NULL,
  radius_m INT NOT NULL CHECK (radius_m BETWEEN 10 AND 200),
  map_x INT NOT NULL, map_y INT NOT NULL, -- hình chữ nhật của khu trên bản đồ 800 x 540
  map_w INT NOT NULL, map_h INT NOT NULL,
  published BIT NOT NULL DEFAULT 1 -- 0 = đang ẩn, web khách không thấy khu này
);

/* UC04, UC05, UC12, UC15: các gian hàng. Mã gian (F1, G3...) cũng là nội dung in trong mã QR. */
CREATE TABLE stalls (
  id VARCHAR(10) PRIMARY KEY, -- F1, G3, T2 (mã in trên QR)
  zone_id VARCHAR(10) NOT NULL REFERENCES zones(id),
  kind VARCHAR(10) NOT NULL CHECK (kind IN ('food','game','craft')),
  map_x INT NOT NULL,
  map_y INT NOT NULL,
  suggested BIT NOT NULL DEFAULT 0, -- gian "nên ghé"
  image_url NVARCHAR(500) NULL,
  published BIT NOT NULL DEFAULT 1, -- 0 = đang ẩn, web khách không thấy gian này
  created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

/* UC06, UC14: lịch diễn, lặp lại mỗi ngày lễ hội. */
CREATE TABLE shows (
  id VARCHAR(10) PRIMARY KEY,
  slot VARCHAR(10) NOT NULL CHECK (slot IN ('morning','noon','afternoon','evening')),
  starts_at TIME(0) NOT NULL,
  ends_at TIME(0) NOT NULL,
  CONSTRAINT ck_shows_time CHECK (ends_at > starts_at)
);

/* UC13 Dịch và duyệt bản dịch: một bảng dịch chung cho khu, gian và suất diễn.
Một dòng = (loại nội dung, mã, trường, ngôn ngữ) -> chữ + trạng thái.
Web khách chỉ đọc bản 'approved' (đã duyệt) và bản tiếng Việt gốc. */
CREATE TABLE translations (
  entity VARCHAR(10) NOT NULL CHECK (entity IN ('zone','stall','show')),
  entity_id VARCHAR(10) NOT NULL,
  field VARCHAR(20) NOT NULL, -- name, label, description, narration, price, allergens
  lang VARCHAR(5) NOT NULL REFERENCES languages(code),
  text NVARCHAR(MAX) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','outdated')),
  updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT pk_translations PRIMARY KEY (entity, entity_id, field, lang)
);

/* UC16 Thông báo khẩn: dòng mới nhất là thông báo đang dùng; active = 1 thì web khách hiện dải thông báo. */
CREATE TABLE announcements (
  id INT IDENTITY(1,1) PRIMARY KEY,
  text_vi NVARCHAR(500) NOT NULL,
  active BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

/* UC10 Tổng quan thống kê. Bảng bắt đầu rỗng (0 lượt), mỗi hành động của khách thêm 1 dòng */
CREATE TABLE visit_events (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  stall_id VARCHAR(10) NULL REFERENCES stalls(id),
  zone_id VARCHAR(10) NULL REFERENCES zones(id),
  lang VARCHAR(5) NOT NULL,
  type VARCHAR(12) NOT NULL CHECK (type IN ('visit','scan','play','zone_enter')),
  device_id VARCHAR(64) NOT NULL, -- mã ngẫu nhiên lưu trong trình duyệt của khách
  created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  last_seen_at DATETIME2 NULL -- chỉ dùng cho dòng 'visit': lần cuối trang khách báo còn mở
);
CREATE INDEX ix_visit_time ON visit_events(created_at);
CREATE INDEX ix_visit_device ON visit_events(type, device_id, created_at);

/* UC09 Đăng nhập: tài khoản ban tổ chức. Mật khẩu lưu dạng băm (bcrypt), KHÔNG lưu mật khẩu thật. */
CREATE TABLE staff_users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  full_name NVARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor'))
);

/* Thuật ngữ: từ tiếng Việt luôn được dịch cố định (tên lễ hội, món đặc sản...).
Khi dịch tự động bằng MyMemory, API thay các từ này bằng bản dịch cố định trước khi gửi đi. */
CREATE TABLE glossary_terms (
  id INT IDENTITY(1,1) PRIMARY KEY,
  term_vi NVARCHAR(100) NOT NULL UNIQUE,
  note NVARCHAR(200) NULL,
  updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
CREATE TABLE glossary_translations (
  term_id INT NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  lang VARCHAR(5) NOT NULL REFERENCES languages(code),
  text NVARCHAR(200) NOT NULL,
  CONSTRAINT pk_glossary_translations PRIMARY KEY (term_id, lang)
);
GO

/* DỮ LIỆU MẪU */
INSERT INTO languages (code, name) VALUES
  ('vi', N'Tiếng Việt'), ('en', N'English'), ('zh', N'中文'),
  ('ko', N'한국어'), ('ja', N'日本語'), ('de', N'Deutsch');
GO

INSERT INTO zones (id, kind, center_lat, center_lng, radius_m, map_x, map_y, map_w, map_h) VALUES
  (N'A', N'food', 10.77405, 106.69205, 40, 40, 270, 270, 200),
  (N'B', N'game', 10.77405, 106.69335, 40, 490, 230, 270, 240),
  (N'C', N'craft', 10.77505, 106.69205, 40, 40, 40, 270, 200),
  (N'D', N'stage', 10.77515, 106.69335, 35, 490, 40, 270, 170),
  (N'E', N'plaza', 10.7746, 106.6927, 30, 330, 140, 140, 250);
GO

INSERT INTO stalls (id, zone_id, kind, map_x, map_y, suggested, image_url) VALUES
  (N'F1', N'A', N'food', 85, 320, 0, N'/api/images/f1.jpg'),
  (N'F2', N'A', N'food', 175, 320, 0, N'/api/images/f2.jpg'),
  (N'F3', N'A', N'food', 265, 320, 0, N'/api/images/f3.jpg'),
  (N'F4', N'A', N'food', 120, 420, 0, N'/api/images/f4.jpg'),
  (N'F5', N'A', N'food', 230, 420, 0, N'/api/images/f5.jpg'),
  (N'G1', N'B', N'game', 540, 290, 0, N'/api/images/g1.jpg'),
  (N'G2', N'B', N'game', 625, 290, 0, N'/api/images/g2.jpg'),
  (N'G3', N'B', N'game', 710, 290, 0, N'/api/images/g3.jpg'),
  (N'G4', N'B', N'game', 540, 365, 0, N'/api/images/g4.png'),
  (N'G5', N'B', N'game', 625, 365, 0, N'/api/images/g5.jpg'),
  (N'G6', N'B', N'game', 710, 365, 0, N'/api/images/g6.png'),
  (N'G7', N'B', N'game', 625, 435, 0, N'/api/images/g7.jpg'),
  (N'T1', N'C', N'craft', 85, 110, 1, N'/api/images/t1.jpg'),
  (N'T2', N'C', N'craft', 175, 110, 1, N'/api/images/t2.jpg'),
  (N'T3', N'C', N'craft', 265, 110, 1, N'/api/images/t3.jpg'),
  (N'T4', N'C', N'craft', 175, 195, 1, N'/api/images/t4.jpg');
GO

INSERT INTO shows (id, slot, starts_at, ends_at) VALUES
  (N'S1', N'morning', N'09:00', N'09:45'),
  (N'S2', N'noon', N'12:00', N'12:45'),
  (N'S3', N'afternoon', N'16:00', N'16:45'),
  (N'S4', N'evening', N'19:30', N'20:30');
GO

INSERT INTO translations (entity, entity_id, field, lang, text, status) VALUES
  (N'zone', N'A', N'name', N'vi', N'Phố Hương Thu', N'approved'),
  (N'zone', N'A', N'name', N'en', N'Autumn Flavours Street', N'approved'),
  (N'zone', N'A', N'name', N'zh', N'秋香美食街', N'approved'),
  (N'zone', N'A', N'name', N'ko', N'가을 향기 먹자골목', N'approved'),
  (N'zone', N'A', N'name', N'ja', N'秋の香りグルメ通り', N'approved'),
  (N'zone', N'A', N'name', N'de', N'Straße der Herbstaromen', N'approved'),
  (N'zone', N'A', N'label', N'vi', N'Ẩm thực', N'approved'),
  (N'zone', N'A', N'label', N'en', N'Food', N'approved'),
  (N'zone', N'A', N'label', N'zh', N'美食', N'approved'),
  (N'zone', N'A', N'label', N'ko', N'음식', N'approved'),
  (N'zone', N'A', N'label', N'ja', N'グルメ', N'approved'),
  (N'zone', N'A', N'label', N'de', N'Essen', N'approved'),
  (N'zone', N'A', N'narration', N'vi', N'Chào mừng bạn đến Phố Hương Thu, khu ẩm thực với 5 gian hàng. Đừng bỏ lỡ cốm làng Vòng, món quà đặc trưng của mùa thu Hà Nội, và bánh trung thu làm thủ công ngay tại chỗ. Mỗi gian hàng có mã QR để nghe giới thiệu món ăn và xem thành phần dị ứng.', N'approved'),
  (N'zone', N'A', N'narration', N'en', N'Welcome to Autumn Flavours Street, the food zone with 5 stalls. Do not miss green rice flakes from Vong village, the signature taste of autumn in Hanoi, and mooncakes handmade on site. Every stall has a QR code where you can hear about each dish and check its allergens.', N'approved'),
  (N'zone', N'B', N'name', N'vi', N'Sân chơi Trăng Vàng', N'approved'),
  (N'zone', N'B', N'name', N'en', N'Golden Moon Playground', N'approved'),
  (N'zone', N'B', N'name', N'zh', N'金月游乐场', N'approved'),
  (N'zone', N'B', N'name', N'ko', N'황금달 놀이마당', N'approved'),
  (N'zone', N'B', N'name', N'ja', N'金色の月の遊び場', N'approved'),
  (N'zone', N'B', N'name', N'de', N'Spielplatz Goldener Mond', N'approved'),
  (N'zone', N'B', N'label', N'vi', N'Trò chơi', N'approved'),
  (N'zone', N'B', N'label', N'en', N'Games', N'approved'),
  (N'zone', N'B', N'label', N'zh', N'游戏', N'approved'),
  (N'zone', N'B', N'label', N'ko', N'놀이', N'approved'),
  (N'zone', N'B', N'label', N'ja', N'ゲーム', N'approved'),
  (N'zone', N'B', N'label', N'de', N'Spiele', N'approved'),
  (N'zone', N'B', N'narration', N'vi', N'Bạn đang ở Sân chơi Trăng Vàng với 7 trò chơi dân gian và trò chơi có thưởng. Kéo co diễn ra vào đầu mỗi giờ, mỗi đội 5 người. Trẻ em dưới 10 tuổi có khu câu cá mini riêng ở cuối sân.', N'approved'),
  (N'zone', N'B', N'narration', N'en', N'You are at the Golden Moon Playground, with 7 folk games and prize games. Tug of war starts at the top of every hour, in teams of 5. Children under 10 have their own mini fishing pond at the far end.', N'approved'),
  (N'zone', N'C', N'name', N'vi', N'Xưởng Sắc Thu', N'approved'),
  (N'zone', N'C', N'name', N'en', N'Autumn Colours Workshop', N'approved'),
  (N'zone', N'C', N'name', N'zh', N'秋色手作坊', N'approved'),
  (N'zone', N'C', N'name', N'ko', N'가을빛 공방', N'approved'),
  (N'zone', N'C', N'name', N'ja', N'秋色の工房', N'approved'),
  (N'zone', N'C', N'name', N'de', N'Werkstatt Herbstfarben', N'approved'),
  (N'zone', N'C', N'label', N'vi', N'Trải nghiệm', N'approved'),
  (N'zone', N'C', N'label', N'en', N'Hands-on', N'approved'),
  (N'zone', N'C', N'label', N'zh', N'体验', N'approved'),
  (N'zone', N'C', N'label', N'ko', N'체험', N'approved'),
  (N'zone', N'C', N'label', N'ja', N'体験', N'approved'),
  (N'zone', N'C', N'label', N'de', N'Mitmachen', N'approved'),
  (N'zone', N'C', N'narration', N'vi', N'Đây là Xưởng Sắc Thu, nơi bạn tự tay làm đèn lồng, in tranh Đông Hồ và chụp ảnh dưới cổng lá vàng. Xưởng đèn lồng mở mỗi 30 phút, mỗi lượt 15 người, nên hãy đăng ký sớm tại gian hàng.', N'approved'),
  (N'zone', N'C', N'narration', N'en', N'This is the Autumn Colours Workshop, where you can make your own lantern, print a Dong Ho folk painting and take photos under the golden leaf gate. Lantern sessions start every 30 minutes for 15 people, so sign up early at the stall.', N'approved'),
  (N'zone', N'D', N'name', N'vi', N'Sân khấu Trăng Thu', N'approved'),
  (N'zone', N'D', N'name', N'en', N'Autumn Moon Stage', N'approved'),
  (N'zone', N'D', N'name', N'zh', N'秋月舞台', N'approved'),
  (N'zone', N'D', N'name', N'ko', N'가을달 무대', N'approved'),
  (N'zone', N'D', N'name', N'ja', N'秋月ステージ', N'approved'),
  (N'zone', N'D', N'name', N'de', N'Bühne Herbstmond', N'approved'),
  (N'zone', N'D', N'label', N'vi', N'Sân khấu', N'approved'),
  (N'zone', N'D', N'label', N'en', N'Stage', N'approved'),
  (N'zone', N'D', N'label', N'zh', N'舞台', N'approved'),
  (N'zone', N'D', N'label', N'ko', N'무대', N'approved'),
  (N'zone', N'D', N'label', N'ja', N'ステージ', N'approved'),
  (N'zone', N'D', N'label', N'de', N'Bühne', N'approved'),
  (N'zone', N'D', N'narration', N'vi', N'Bạn đang đứng trước Sân khấu Trăng Thu. Mỗi ngày có 4 suất diễn: múa lân lúc 9 giờ, hòa tấu nhạc cụ dân tộc lúc 12 giờ, trình diễn áo dài lúc 16 giờ và đêm nhạc rước đèn lúc 19 giờ 30.', N'approved'),
  (N'zone', N'D', N'narration', N'en', N'You are in front of the Autumn Moon Stage. There are 4 shows every day: a lion dance at 9 am, a traditional music ensemble at noon, an ao dai show at 4 pm and a music night with a lantern parade at 7:30 pm.', N'approved'),
  (N'zone', N'E', N'name', N'vi', N'Quảng trường Lá Phong', N'approved'),
  (N'zone', N'E', N'name', N'en', N'Maple Leaf Square', N'approved'),
  (N'zone', N'E', N'name', N'zh', N'枫叶广场', N'approved'),
  (N'zone', N'E', N'name', N'ko', N'단풍잎 광장', N'approved'),
  (N'zone', N'E', N'name', N'ja', N'もみじ広場', N'approved'),
  (N'zone', N'E', N'name', N'de', N'Ahornblatt-Platz', N'approved'),
  (N'zone', N'E', N'label', N'vi', N'Quảng trường', N'approved'),
  (N'zone', N'E', N'label', N'en', N'Square', N'approved'),
  (N'zone', N'E', N'label', N'zh', N'广场', N'approved'),
  (N'zone', N'E', N'label', N'ko', N'광장', N'approved'),
  (N'zone', N'E', N'label', N'ja', N'広場', N'approved'),
  (N'zone', N'E', N'label', N'de', N'Platz', N'approved'),
  (N'zone', N'E', N'narration', N'vi', N'Chào mừng bạn đến lễ hội Mùa thu lộng lẫy. Đây là quảng trường trung tâm, bên trái là khu ẩm thực và xưởng trải nghiệm, bên phải là sân khấu và sân chơi. Điểm thông tin và trạm y tế nằm gần cổng chính.', N'approved'),
  (N'zone', N'E', N'narration', N'en', N'Welcome to the Splendid Autumn festival. This is the central square: food and workshops are on your left, the stage and playground on your right. The information desk and first aid point are near the main gate.', N'approved'),
  (N'stall', N'F1', N'name', N'vi', N'Bánh trung thu thủ công', N'approved'),
  (N'stall', N'F1', N'name', N'en', N'Handmade mooncakes', N'approved'),
  (N'stall', N'F1', N'name', N'zh', N'手工月饼', N'approved'),
  (N'stall', N'F1', N'name', N'ko', N'수제 월병', N'approved'),
  (N'stall', N'F1', N'name', N'ja', N'手作り月餅', N'approved'),
  (N'stall', N'F1', N'name', N'de', N'Handgemachte Mondkuchen', N'approved'),
  (N'stall', N'F1', N'description', N'vi', N'Bánh nướng, bánh dẻo nhân sen, đậu xanh, thập cẩm, làm tại chỗ.', N'approved'),
  (N'stall', N'F1', N'description', N'en', N'Baked and snowskin mooncakes with lotus, mung bean or mixed nuts, made on site.', N'approved'),
  (N'stall', N'F1', N'price', N'vi', N'35.000–60.000đ', N'approved'),
  (N'stall', N'F1', N'price', N'en', N'35,000–60,000 VND', N'approved'),
  (N'stall', N'F1', N'allergens', N'vi', N'trứng, gluten, các loại hạt', N'approved'),
  (N'stall', N'F1', N'allergens', N'en', N'egg, gluten, nuts', N'approved'),
  (N'stall', N'F2', N'name', N'vi', N'Cốm làng Vòng', N'approved'),
  (N'stall', N'F2', N'name', N'en', N'Vong village green rice', N'approved'),
  (N'stall', N'F2', N'name', N'zh', N'冯村青米片', N'approved'),
  (N'stall', N'F2', N'name', N'ko', N'봉 마을 풋쌀', N'approved'),
  (N'stall', N'F2', N'name', N'ja', N'ヴォン村の青米', N'approved'),
  (N'stall', N'F2', N'name', N'de', N'Grüner Reis aus dem Dorf Vong', N'approved'),
  (N'stall', N'F2', N'description', N'vi', N'Cốm tươi gói lá sen, chè cốm, xôi cốm.', N'approved'),
  (N'stall', N'F2', N'description', N'en', N'Fresh green rice flakes in lotus leaves, sweet soup and sticky rice.', N'approved'),
  (N'stall', N'F2', N'price', N'vi', N'30.000–50.000đ', N'approved'),
  (N'stall', N'F2', N'price', N'en', N'30,000–50,000 VND', N'approved'),
  (N'stall', N'F2', N'allergens', N'vi', N'không có', N'approved'),
  (N'stall', N'F2', N'allergens', N'en', N'none', N'approved'),
  (N'stall', N'F3', N'name', N'vi', N'Bánh xèo miền Tây', N'approved'),
  (N'stall', N'F3', N'name', N'en', N'Mekong sizzling pancakes', N'approved'),
  (N'stall', N'F3', N'name', N'zh', N'湄公河煎饼', N'approved'),
  (N'stall', N'F3', N'name', N'ko', N'메콩 반쎄오', N'approved'),
  (N'stall', N'F3', N'name', N'ja', N'メコン風バインセオ', N'approved'),
  (N'stall', N'F3', N'name', N'de', N'Mekong-Pfannkuchen', N'approved'),
  (N'stall', N'F3', N'description', N'vi', N'Vỏ giòn nghệ, nhân tôm thịt, ăn kèm rau rừng.', N'approved'),
  (N'stall', N'F3', N'description', N'en', N'Crispy turmeric crepes with shrimp and pork, served with wild greens.', N'approved'),
  (N'stall', N'F3', N'price', N'vi', N'45.000–70.000đ', N'approved'),
  (N'stall', N'F3', N'price', N'en', N'45,000–70,000 VND', N'approved'),
  (N'stall', N'F3', N'allergens', N'vi', N'tôm', N'approved'),
  (N'stall', N'F3', N'allergens', N'en', N'shrimp', N'approved'),
  (N'stall', N'F4', N'name', N'vi', N'Xiên nướng phố đêm', N'approved'),
  (N'stall', N'F4', N'name', N'en', N'Night-market skewers', N'approved'),
  (N'stall', N'F4', N'name', N'zh', N'夜市烤串', N'approved'),
  (N'stall', N'F4', N'name', N'ko', N'야시장 꼬치', N'approved'),
  (N'stall', N'F4', N'name', N'ja', N'夜市の串焼き', N'approved'),
  (N'stall', N'F4', N'name', N'de', N'Spieße vom Nachtmarkt', N'approved'),
  (N'stall', N'F4', N'description', N'vi', N'Xiên thịt, rau củ và hải sản nướng than, sốt sa tế.', N'approved'),
  (N'stall', N'F4', N'description', N'en', N'Charcoal-grilled meat, vegetable and seafood skewers with chilli sauce.', N'approved'),
  (N'stall', N'F4', N'price', N'vi', N'25.000–60.000đ', N'approved'),
  (N'stall', N'F4', N'price', N'en', N'25,000–60,000 VND', N'approved'),
  (N'stall', N'F4', N'allergens', N'vi', N'đậu nành, hải sản', N'approved'),
  (N'stall', N'F4', N'allergens', N'en', N'soy, seafood', N'approved'),
  (N'stall', N'F5', N'name', N'vi', N'Quầy trà Lá Phong', N'approved'),
  (N'stall', N'F5', N'name', N'en', N'Maple Leaf tea bar', N'approved'),
  (N'stall', N'F5', N'name', N'zh', N'枫叶茶吧', N'approved'),
  (N'stall', N'F5', N'name', N'ko', N'단풍잎 찻집', N'approved'),
  (N'stall', N'F5', N'name', N'ja', N'もみじティーバー', N'approved'),
  (N'stall', N'F5', N'name', N'de', N'Ahornblatt-Teebar', N'approved'),
  (N'stall', N'F5', N'description', N'vi', N'Trà sen, cà phê trứng, sữa ngô nóng.', N'approved'),
  (N'stall', N'F5', N'description', N'en', N'Lotus tea, egg coffee and hot corn milk.', N'approved'),
  (N'stall', N'F5', N'price', N'vi', N'25.000–45.000đ', N'approved'),
  (N'stall', N'F5', N'price', N'en', N'25,000–45,000 VND', N'approved'),
  (N'stall', N'F5', N'allergens', N'vi', N'trứng, sữa', N'approved'),
  (N'stall', N'F5', N'allergens', N'en', N'egg, milk', N'approved'),
  (N'stall', N'G1', N'name', N'vi', N'Ném vòng cổ chai', N'approved'),
  (N'stall', N'G1', N'name', N'en', N'Ring toss', N'approved'),
  (N'stall', N'G1', N'name', N'zh', N'套圈', N'approved'),
  (N'stall', N'G1', N'name', N'ko', N'고리 던지기', N'approved'),
  (N'stall', N'G1', N'name', N'ja', N'輪投げ', N'approved'),
  (N'stall', N'G1', N'name', N'de', N'Ringwerfen', N'approved'),
  (N'stall', N'G1', N'description', N'vi', N'Ném vòng trúng cổ chai để nhận quà.', N'approved'),
  (N'stall', N'G1', N'description', N'en', N'Land a ring on a bottle neck to win a prize.', N'approved'),
  (N'stall', N'G1', N'price', N'vi', N'20.000đ / 5 vòng', N'approved'),
  (N'stall', N'G1', N'price', N'en', N'20,000 VND / 5 rings', N'approved'),
  (N'stall', N'G2', N'name', N'vi', N'Bịt mắt đập niêu', N'approved'),
  (N'stall', N'G2', N'name', N'en', N'Blindfolded pot smashing', N'approved'),
  (N'stall', N'G2', N'name', N'zh', N'蒙眼砸陶罐', N'approved'),
  (N'stall', N'G2', N'name', N'ko', N'눈 가리고 항아리 깨기', N'approved'),
  (N'stall', N'G2', N'name', N'ja', N'目隠しつぼ割り', N'approved'),
  (N'stall', N'G2', N'name', N'de', N'Topfschlagen mit verbundenen Augen', N'approved'),
  (N'stall', N'G2', N'description', N'vi', N'Bịt mắt, nghe người cổ vũ chỉ đường để đập niêu.', N'approved'),
  (N'stall', N'G2', N'description', N'en', N'Blindfolded, follow the crowd’s shouts to smash the clay pot.', N'approved'),
  (N'stall', N'G2', N'price', N'vi', N'15.000đ / lượt', N'approved'),
  (N'stall', N'G2', N'price', N'en', N'15,000 VND / turn', N'approved'),
  (N'stall', N'G3', N'name', N'vi', N'Kéo co', N'approved'),
  (N'stall', N'G3', N'name', N'en', N'Tug of war', N'approved'),
  (N'stall', N'G3', N'name', N'zh', N'拔河', N'approved'),
  (N'stall', N'G3', N'name', N'ko', N'줄다리기', N'approved'),
  (N'stall', N'G3', N'name', N'ja', N'綱引き', N'approved'),
  (N'stall', N'G3', N'name', N'de', N'Tauziehen', N'approved'),
  (N'stall', N'G3', N'description', N'vi', N'Đội 5 người, thi vào đầu mỗi giờ.', N'approved'),
  (N'stall', N'G3', N'description', N'en', N'Teams of 5, matches at the top of every hour.', N'approved'),
  (N'stall', N'G3', N'price', N'vi', N'Miễn phí', N'approved'),
  (N'stall', N'G3', N'price', N'en', N'Free', N'approved'),
  (N'stall', N'G4', N'name', N'vi', N'Nhảy bao bố', N'approved'),
  (N'stall', N'G4', N'name', N'en', N'Sack race', N'approved'),
  (N'stall', N'G4', N'name', N'zh', N'袋鼠跳', N'approved'),
  (N'stall', N'G4', N'name', N'ko', N'자루 달리기', N'approved'),
  (N'stall', N'G4', N'name', N'ja', N'袋跳び競走', N'approved'),
  (N'stall', N'G4', N'name', N'de', N'Sackhüpfen', N'approved'),
  (N'stall', N'G4', N'description', N'vi', N'Đua nhảy bao bố 20 m, 4 người một lượt.', N'approved'),
  (N'stall', N'G4', N'description', N'en', N'A 20 m sack race, 4 players per round.', N'approved'),
  (N'stall', N'G4', N'price', N'vi', N'Miễn phí', N'approved'),
  (N'stall', N'G4', N'price', N'en', N'Free', N'approved'),
  (N'stall', N'G5', N'name', N'vi', N'Ô ăn quan', N'approved'),
  (N'stall', N'G5', N'name', N'en', N'O an quan board game', N'approved'),
  (N'stall', N'G5', N'name', N'zh', N'吃官棋', N'approved'),
  (N'stall', N'G5', N'name', N'ko', N'오안꽌 보드게임', N'approved'),
  (N'stall', N'G5', N'name', N'ja', N'オアンクアン（ボードゲーム）', N'approved'),
  (N'stall', N'G5', N'name', N'de', N'Brettspiel O an quan', N'approved'),
  (N'stall', N'G5', N'description', N'vi', N'Trò chơi chiến thuật dân gian, có người hướng dẫn luật.', N'approved'),
  (N'stall', N'G5', N'description', N'en', N'A folk strategy game, with a guide to explain the rules.', N'approved'),
  (N'stall', N'G5', N'price', N'vi', N'Miễn phí', N'approved'),
  (N'stall', N'G5', N'price', N'en', N'Free', N'approved'),
  (N'stall', N'G6', N'name', N'vi', N'Ném lon trúng thưởng', N'approved'),
  (N'stall', N'G6', N'name', N'en', N'Can knockdown', N'approved'),
  (N'stall', N'G6', N'name', N'zh', N'掷罐赢奖', N'approved'),
  (N'stall', N'G6', N'name', N'ko', N'캔 쓰러뜨리기', N'approved'),
  (N'stall', N'G6', N'name', N'ja', N'缶倒しゲーム', N'approved'),
  (N'stall', N'G6', N'name', N'de', N'Dosenwerfen', N'approved'),
  (N'stall', N'G6', N'description', N'vi', N'Ném bóng làm đổ tháp lon để nhận quà.', N'approved'),
  (N'stall', N'G6', N'description', N'en', N'Knock down the can tower with a ball to win.', N'approved'),
  (N'stall', N'G6', N'price', N'vi', N'20.000đ / 3 bóng', N'approved'),
  (N'stall', N'G6', N'price', N'en', N'20,000 VND / 3 balls', N'approved'),
  (N'stall', N'G7', N'name', N'vi', N'Câu cá mini cho bé', N'approved'),
  (N'stall', N'G7', N'name', N'en', N'Mini fishing for kids', N'approved'),
  (N'stall', N'G7', N'name', N'zh', N'儿童迷你钓鱼', N'approved'),
  (N'stall', N'G7', N'name', N'ko', N'어린이 미니 낚시', N'approved'),
  (N'stall', N'G7', N'name', N'ja', N'子ども用ミニ釣り', N'approved'),
  (N'stall', N'G7', N'name', N'de', N'Mini-Angeln für Kinder', N'approved'),
  (N'stall', N'G7', N'description', N'vi', N'Hồ câu cá đồ chơi cho trẻ dưới 10 tuổi.', N'approved'),
  (N'stall', N'G7', N'description', N'en', N'A toy fishing pond for children under 10.', N'approved'),
  (N'stall', N'G7', N'price', N'vi', N'25.000đ / 10 phút', N'approved'),
  (N'stall', N'G7', N'price', N'en', N'25,000 VND / 10 min', N'approved'),
  (N'stall', N'T1', N'name', N'vi', N'Xưởng làm đèn lồng', N'approved'),
  (N'stall', N'T1', N'name', N'en', N'Lantern-making workshop', N'approved'),
  (N'stall', N'T1', N'name', N'zh', N'灯笼制作坊', N'approved'),
  (N'stall', N'T1', N'name', N'ko', N'등불 만들기 공방', N'approved'),
  (N'stall', N'T1', N'name', N'ja', N'提灯づくり工房', N'approved'),
  (N'stall', N'T1', N'name', N'de', N'Laternen-Werkstatt', N'approved'),
  (N'stall', N'T1', N'description', N'vi', N'Tự làm đèn lồng giấy trong 30 phút và mang về.', N'approved'),
  (N'stall', N'T1', N'description', N'en', N'Make a paper lantern in 30 minutes and take it home.', N'approved'),
  (N'stall', N'T1', N'price', N'vi', N'50.000đ / người', N'approved'),
  (N'stall', N'T1', N'price', N'en', N'50,000 VND / person', N'approved'),
  (N'stall', N'T2', N'name', N'vi', N'In tranh Đông Hồ', N'approved'),
  (N'stall', N'T2', N'name', N'en', N'Dong Ho woodblock printing', N'approved'),
  (N'stall', N'T2', N'name', N'zh', N'东湖木版画', N'approved'),
  (N'stall', N'T2', N'name', N'ko', N'동호 목판화', N'approved'),
  (N'stall', N'T2', N'name', N'ja', N'ドンホー版画', N'approved'),
  (N'stall', N'T2', N'name', N'de', N'Dong-Ho-Holzdruck', N'approved'),
  (N'stall', N'T2', N'description', N'vi', N'In tranh dân gian bằng khuôn gỗ và màu tự nhiên.', N'approved'),
  (N'stall', N'T2', N'description', N'en', N'Print a folk painting with wooden blocks and natural colours.', N'approved'),
  (N'stall', N'T2', N'price', N'vi', N'40.000đ / tranh', N'approved'),
  (N'stall', N'T2', N'price', N'en', N'40,000 VND / print', N'approved'),
  (N'stall', N'T3', N'name', N'vi', N'Cổng ảnh Lá Vàng', N'approved'),
  (N'stall', N'T3', N'name', N'en', N'Golden Leaf photo gate', N'approved'),
  (N'stall', N'T3', N'name', N'zh', N'金叶拍照门', N'approved'),
  (N'stall', N'T3', N'name', N'ko', N'황금잎 포토존', N'approved'),
  (N'stall', N'T3', N'name', N'ja', N'金色の葉のフォトゲート', N'approved'),
  (N'stall', N'T3', N'name', N'de', N'Fototor Goldenes Blatt', N'approved'),
  (N'stall', N'T3', N'description', N'vi', N'Góc chụp ảnh với cổng lá phong, in ảnh lấy liền.', N'approved'),
  (N'stall', N'T3', N'description', N'en', N'A maple leaf photo arch with instant prints.', N'approved'),
  (N'stall', N'T3', N'price', N'vi', N'Miễn phí, in ảnh 30.000đ', N'approved'),
  (N'stall', N'T3', N'price', N'en', N'Free, prints 30,000 VND', N'approved'),
  (N'stall', N'T4', N'name', N'vi', N'Quầy lưu niệm và đổi tem', N'approved'),
  (N'stall', N'T4', N'name', N'en', N'Souvenirs and stamp exchange', N'approved'),
  (N'stall', N'T4', N'name', N'zh', N'纪念品与集章兑换', N'approved'),
  (N'stall', N'T4', N'name', N'ko', N'기념품·스탬프 교환', N'approved'),
  (N'stall', N'T4', N'name', N'ja', N'お土産とスタンプ交換', N'approved'),
  (N'stall', N'T4', N'name', N'de', N'Souvenirs und Stempeltausch', N'approved'),
  (N'stall', N'T4', N'description', N'vi', N'Bán đồ lưu niệm và đổi tem săn được lấy quà.', N'approved'),
  (N'stall', N'T4', N'description', N'en', N'Souvenirs, and the place to swap your stamps for a gift.', N'approved'),
  (N'stall', N'T4', N'price', N'vi', N'Từ 20.000đ', N'approved'),
  (N'stall', N'T4', N'price', N'en', N'From 20,000 VND', N'approved'),
  (N'show', N'S1', N'name', N'vi', N'Múa lân khai hội', N'approved'),
  (N'show', N'S1', N'name', N'en', N'Opening lion dance', N'approved'),
  (N'show', N'S1', N'name', N'zh', N'开幕舞狮', N'approved'),
  (N'show', N'S1', N'name', N'ko', N'개막 사자춤', N'approved'),
  (N'show', N'S1', N'name', N'ja', N'開幕の獅子舞', N'approved'),
  (N'show', N'S1', N'name', N'de', N'Löwentanz zur Eröffnung', N'approved'),
  (N'show', N'S1', N'description', N'vi', N'Đoàn lân 12 người, trống và chiêng mở màn ngày hội.', N'approved'),
  (N'show', N'S1', N'description', N'en', N'A 12-member lion troupe with drums and gongs opens the day.', N'approved'),
  (N'show', N'S2', N'name', N'vi', N'Hòa tấu nhạc cụ dân tộc', N'approved'),
  (N'show', N'S2', N'name', N'en', N'Traditional music ensemble', N'approved'),
  (N'show', N'S2', N'name', N'zh', N'民族乐器合奏', N'approved'),
  (N'show', N'S2', N'name', N'ko', N'전통 악기 합주', N'approved'),
  (N'show', N'S2', N'name', N'ja', N'民族楽器の合奏', N'approved'),
  (N'show', N'S2', N'name', N'de', N'Traditionelles Musikensemble', N'approved'),
  (N'show', N'S2', N'description', N'vi', N'Đàn bầu, đàn tranh, sáo trúc với các bài dân ca ba miền.', N'approved'),
  (N'show', N'S2', N'description', N'en', N'Monochord, zither and bamboo flute playing folk songs from all three regions.', N'approved'),
  (N'show', N'S3', N'name', N'vi', N'Trình diễn áo dài “Sắc thu”', N'approved'),
  (N'show', N'S3', N'name', N'en', N'“Autumn Hues” ao dai show', N'approved'),
  (N'show', N'S3', N'name', N'zh', N'“秋色”奥黛秀', N'approved'),
  (N'show', N'S3', N'name', N'ko', N'“가을빛” 아오자이 쇼', N'approved'),
  (N'show', N'S3', N'name', N'ja', N'アオザイショー「秋色」', N'approved'),
  (N'show', N'S3', N'name', N'de', N'Ao-Dai-Show „Herbstfarben“', N'approved'),
  (N'show', N'S3', N'description', N'vi', N'Bộ sưu tập áo dài tông vàng, cam, nâu lá thu.', N'approved'),
  (N'show', N'S3', N'description', N'en', N'An ao dai collection in the gold, orange and brown of autumn leaves.', N'approved'),
  (N'show', N'S4', N'name', N'vi', N'Đêm nhạc Thu ca và rước đèn', N'approved'),
  (N'show', N'S4', N'name', N'en', N'Autumn songs and lantern parade', N'approved'),
  (N'show', N'S4', N'name', N'zh', N'秋歌之夜与提灯游行', N'approved'),
  (N'show', N'S4', N'name', N'ko', N'가을 노래의 밤과 등불 행렬', N'approved'),
  (N'show', N'S4', N'name', N'ja', N'秋の歌の夜と提灯行列', N'approved'),
  (N'show', N'S4', N'name', N'de', N'Herbstlieder und Laternenumzug', N'approved'),
  (N'show', N'S4', N'description', N'vi', N'Nhạc acoustic, kết thúc bằng đoàn rước đèn lồng quanh hồ.', N'approved'),
  (N'show', N'S4', N'description', N'en', N'Acoustic music, ending with a lantern parade around the lake.', N'approved');
GO

MERGE translations AS t
USING (VALUES
  (N'zone', N'A', N'narration', N'zh', N'欢迎来到秋香街，这是有5个摊位的美食区。千万别错过绿村的青米片，这是河内秋天的代表味道，还有现场手工制作的月饼。每个摊位都有二维码，扫码即可收听菜品介绍并查看过敏原。'),
  (N'zone', N'A', N'narration', N'ko', N'가을 향기 거리에 오신 것을 환영합니다. 5개 부스가 있는 먹거리 구역입니다. 하노이 가을의 대표 맛인 봉 마을 풋쌀 꼼과 현장에서 직접 만드는 월병을 놓치지 마세요. 각 부스의 QR 코드를 스캔하면 음식 소개를 듣고 알레르기 성분을 확인할 수 있습니다.'),
  (N'zone', N'A', N'narration', N'ja', N'秋の香り通りへようこそ。5つの屋台が並ぶフードエリアです。ハノイの秋を代表する味、ヴォン村の青米コムと、その場で手作りする月餅をお見逃しなく。各屋台のQRコードを読み取ると、料理の紹介を聞いたりアレルゲンを確認したりできます。'),
  (N'zone', N'A', N'narration', N'de', N'Willkommen in der Straße der Herbstaromen, dem Essensbereich mit 5 Ständen. Verpassen Sie nicht die grünen Reisflocken aus dem Dorf Vong, den typischen Geschmack des Hanoier Herbstes, und die vor Ort handgemachten Mondkuchen. An jedem Stand gibt es einen QR-Code: Scannen Sie ihn, um mehr über die Gerichte zu hören und die Allergene zu sehen.'),
  (N'zone', N'B', N'narration', N'zh', N'您现在位于金月游乐场，这里有7个民间游戏和有奖游戏。拔河比赛每个整点开始，每队5人。10岁以下的小朋友在场地尽头有专属的迷你钓鱼池。'),
  (N'zone', N'B', N'narration', N'ko', N'지금 계신 곳은 황금달 놀이마당으로, 7가지 민속놀이와 상품 게임이 있습니다. 줄다리기는 매시 정각에 5명씩 한 팀으로 시작합니다. 10세 미만 어린이를 위한 미니 낚시터는 마당 끝쪽에 있습니다.'),
  (N'zone', N'B', N'narration', N'ja', N'ここは金色の月の遊び場です。7つの伝統遊びと景品ゲームがあります。綱引きは毎正時に5人1チームで始まります。10歳未満のお子さま向けのミニ釣り堀は奥にあります。'),
  (N'zone', N'B', N'narration', N'de', N'Sie sind auf dem Spielplatz Goldener Mond mit 7 Volksspielen und Gewinnspielen. Das Tauziehen beginnt zu jeder vollen Stunde, in Teams zu je 5 Personen. Kinder unter 10 Jahren haben am hinteren Ende einen eigenen Mini-Angelteich.'),
  (N'zone', N'C', N'narration', N'zh', N'这里是秋色工坊，您可以亲手制作灯笼、印制东湖民间画，并在金叶拱门下拍照。灯笼课程每30分钟一场，每场15人，请尽早到摊位报名。'),
  (N'zone', N'C', N'narration', N'ko', N'이곳은 가을빛 공방입니다. 직접 등불을 만들고, 동호 민화를 찍어 보고, 황금 낙엽 아치 아래에서 사진을 찍을 수 있습니다. 등불 만들기는 30분마다 15명씩 진행되니 부스에서 미리 신청하세요.'),
  (N'zone', N'C', N'narration', N'ja', N'ここは秋色の工房です。提灯を手作りしたり、ドンホー版画を刷ったり、黄金の葉のアーチの下で写真を撮ったりできます。提灯づくりは30分ごとに15名ずつなので、早めに屋台でお申し込みください。'),
  (N'zone', N'C', N'narration', N'de', N'Dies ist die Werkstatt der Herbstfarben. Hier können Sie Ihre eigene Laterne basteln, ein Dong-Ho-Volksbild drucken und unter dem Tor aus goldenen Blättern Fotos machen. Die Laternenkurse beginnen alle 30 Minuten für 15 Personen, melden Sie sich also früh am Stand an.'),
  (N'zone', N'D', N'narration', N'zh', N'您现在位于秋月舞台前。每天有4场演出：上午9点舞狮，中午民族器乐合奏，下午4点奥黛表演，晚上7点半音乐之夜和灯笼游行。'),
  (N'zone', N'D', N'narration', N'ko', N'지금 가을달 무대 앞에 계십니다. 매일 4개의 공연이 있습니다. 오전 9시 사자춤, 정오 전통 악기 합주, 오후 4시 아오자이 쇼, 저녁 7시 30분 음악의 밤과 등불 행렬입니다.'),
  (N'zone', N'D', N'narration', N'ja', N'ここは秋の月のステージの前です。毎日4つの公演があります。午前9時の獅子舞、正午の民族楽器の合奏、午後4時のアオザイショー、そして午後7時30分の音楽の夜と提灯行列です。'),
  (N'zone', N'D', N'narration', N'de', N'Sie stehen vor der Bühne Herbstmond. Jeden Tag gibt es 4 Vorstellungen: um 9 Uhr einen Löwentanz, mittags ein Ensemble traditioneller Musik, um 16 Uhr eine Ao-Dai-Show und um 19:30 Uhr einen Musikabend mit Laternenumzug.'),
  (N'zone', N'E', N'narration', N'zh', N'欢迎来到“灿烂金秋”节。这里是中心广场：美食区和工坊在您的左边，舞台和游乐场在您的右边。服务台和急救点在正门附近。'),
  (N'zone', N'E', N'narration', N'ko', N'"찬란한 가을" 축제에 오신 것을 환영합니다. 이곳은 중앙 광장입니다. 왼쪽에는 먹거리와 공방이, 오른쪽에는 무대와 놀이마당이 있습니다. 안내소와 응급처치소는 정문 근처에 있습니다.'),
  (N'zone', N'E', N'narration', N'ja', N'「華やかな秋」フェスティバルへようこそ。ここは中央広場です。左手にフードエリアと工房、右手にステージと遊び場があります。案内所と救護所は正門の近くです。'),
  (N'zone', N'E', N'narration', N'de', N'Willkommen beim Festival „Prächtiger Herbst“. Dies ist der zentrale Platz: Essen und Werkstätten liegen links, Bühne und Spielplatz rechts. Infostand und Erste-Hilfe-Stelle befinden sich am Haupteingang.'),
  (N'stall', N'F1', N'description', N'zh', N'烤月饼和冰皮月饼，莲蓉、绿豆或五仁馅，现场制作。'),
  (N'stall', N'F1', N'description', N'ko', N'연꽃씨, 녹두, 견과류 소를 넣은 구운 월병과 찹쌀 월병을 현장에서 만듭니다.'),
  (N'stall', N'F1', N'description', N'ja', N'蓮の実、緑豆、ナッツ入りの焼き月餅と冰皮月餅をその場で作ります。'),
  (N'stall', N'F1', N'description', N'de', N'Gebackene Mondkuchen und Schneehaut-Mondkuchen mit Lotus, Mungbohnen oder Nüssen, vor Ort gemacht.'),
  (N'stall', N'F1', N'price', N'zh', N'35,000–60,000 越南盾'),
  (N'stall', N'F1', N'price', N'ko', N'35,000–60,000동'),
  (N'stall', N'F1', N'price', N'ja', N'35,000〜60,000ドン'),
  (N'stall', N'F1', N'price', N'de', N'35.000–60.000 VND'),
  (N'stall', N'F1', N'allergens', N'zh', N'鸡蛋、麸质、坚果'),
  (N'stall', N'F1', N'allergens', N'ko', N'달걀, 글루텐, 견과류'),
  (N'stall', N'F1', N'allergens', N'ja', N'卵、グルテン、ナッツ'),
  (N'stall', N'F1', N'allergens', N'de', N'Ei, Gluten, Nüsse'),
  (N'stall', N'F2', N'description', N'zh', N'荷叶包的新鲜青米片、甜汤和青米糯米饭。'),
  (N'stall', N'F2', N'description', N'ko', N'연잎에 싼 햇풋쌀 꼼, 꼼 단팥죽, 꼼 찹쌀밥.'),
  (N'stall', N'F2', N'description', N'ja', N'蓮の葉に包んだ新鮮な青米コム、チェー、おこわ。'),
  (N'stall', N'F2', N'description', N'de', N'Frische grüne Reisflocken in Lotusblättern, süße Suppe und Klebreis.'),
  (N'stall', N'F2', N'price', N'zh', N'30,000–50,000 越南盾'),
  (N'stall', N'F2', N'price', N'ko', N'30,000–50,000동'),
  (N'stall', N'F2', N'price', N'ja', N'30,000〜50,000ドン'),
  (N'stall', N'F2', N'price', N'de', N'30.000–50.000 VND'),
  (N'stall', N'F2', N'allergens', N'zh', N'无'),
  (N'stall', N'F2', N'allergens', N'ko', N'없음'),
  (N'stall', N'F2', N'allergens', N'ja', N'なし'),
  (N'stall', N'F2', N'allergens', N'de', N'keine'),
  (N'stall', N'F3', N'description', N'zh', N'姜黄脆煎饼，内馅虾和猪肉，配山野菜食用。'),
  (N'stall', N'F3', N'description', N'ko', N'강황을 넣은 바삭한 반쎄오에 새우와 돼지고기를 넣고 들나물과 함께 먹습니다.'),
  (N'stall', N'F3', N'description', N'ja', N'ターメリック入りのパリパリのバインセオ。エビと豚肉入りで、野草と一緒に食べます。'),
  (N'stall', N'F3', N'description', N'de', N'Knusprige Kurkuma-Pfannkuchen mit Garnelen und Schweinefleisch, dazu wildes Grün.'),
  (N'stall', N'F3', N'price', N'zh', N'45,000–70,000 越南盾'),
  (N'stall', N'F3', N'price', N'ko', N'45,000–70,000동'),
  (N'stall', N'F3', N'price', N'ja', N'45,000〜70,000ドン'),
  (N'stall', N'F3', N'price', N'de', N'45.000–70.000 VND'),
  (N'stall', N'F3', N'allergens', N'zh', N'虾'),
  (N'stall', N'F3', N'allergens', N'ko', N'새우'),
  (N'stall', N'F3', N'allergens', N'ja', N'エビ'),
  (N'stall', N'F3', N'allergens', N'de', N'Garnelen'),
  (N'stall', N'F4', N'description', N'zh', N'炭烤肉类、蔬菜和海鲜串，配辣酱。'),
  (N'stall', N'F4', N'description', N'ko', N'숯불에 구운 고기, 채소, 해산물 꼬치와 매운 소스.'),
  (N'stall', N'F4', N'description', N'ja', N'炭火で焼いた肉、野菜、シーフードの串焼き、チリソース添え。'),
  (N'stall', N'F4', N'description', N'de', N'Über Holzkohle gegrillte Spieße mit Fleisch, Gemüse und Meeresfrüchten, dazu Chilisoße.'),
  (N'stall', N'F4', N'price', N'zh', N'25,000–60,000 越南盾'),
  (N'stall', N'F4', N'price', N'ko', N'25,000–60,000동'),
  (N'stall', N'F4', N'price', N'ja', N'25,000〜60,000ドン'),
  (N'stall', N'F4', N'price', N'de', N'25.000–60.000 VND'),
  (N'stall', N'F4', N'allergens', N'zh', N'大豆、海鲜'),
  (N'stall', N'F4', N'allergens', N'ko', N'대두, 해산물'),
  (N'stall', N'F4', N'allergens', N'ja', N'大豆、魚介類'),
  (N'stall', N'F4', N'allergens', N'de', N'Soja, Meeresfrüchte'),
  (N'stall', N'F5', N'description', N'zh', N'莲花茶、鸡蛋咖啡和热玉米牛奶。'),
  (N'stall', N'F5', N'description', N'ko', N'연꽃차, 에그 커피, 따뜻한 옥수수 우유.'),
  (N'stall', N'F5', N'description', N'ja', N'蓮茶、エッグコーヒー、温かいコーンミルク。'),
  (N'stall', N'F5', N'description', N'de', N'Lotustee, Eierkaffee und heiße Maismilch.'),
  (N'stall', N'F5', N'price', N'zh', N'25,000–45,000 越南盾'),
  (N'stall', N'F5', N'price', N'ko', N'25,000–45,000동'),
  (N'stall', N'F5', N'price', N'ja', N'25,000〜45,000ドン'),
  (N'stall', N'F5', N'price', N'de', N'25.000–45.000 VND'),
  (N'stall', N'F5', N'allergens', N'zh', N'鸡蛋、牛奶'),
  (N'stall', N'F5', N'allergens', N'ko', N'달걀, 우유'),
  (N'stall', N'F5', N'allergens', N'ja', N'卵、乳'),
  (N'stall', N'F5', N'allergens', N'de', N'Ei, Milch'),
  (N'stall', N'G1', N'description', N'zh', N'把圈套中瓶颈即可赢得奖品。'),
  (N'stall', N'G1', N'description', N'ko', N'병목에 고리를 걸면 상품을 받습니다.'),
  (N'stall', N'G1', N'description', N'ja', N'瓶の首に輪を入れると景品がもらえます。'),
  (N'stall', N'G1', N'description', N'de', N'Wirf einen Ring über einen Flaschenhals und gewinne einen Preis.'),
  (N'stall', N'G1', N'price', N'zh', N'20,000 越南盾 / 5 个圈'),
  (N'stall', N'G1', N'price', N'ko', N'20,000동 / 고리 5개'),
  (N'stall', N'G1', N'price', N'ja', N'20,000ドン / 輪5本'),
  (N'stall', N'G1', N'price', N'de', N'20.000 VND / 5 Ringe'),
  (N'stall', N'G2', N'description', N'zh', N'蒙上眼睛，听着大家的喊声去敲陶罐。'),
  (N'stall', N'G2', N'description', N'ko', N'눈을 가리고 응원 소리를 따라가 항아리를 깨뜨립니다.'),
  (N'stall', N'G2', N'description', N'ja', N'目隠しをして、みんなの声を頼りに素焼きの壺を割ります。'),
  (N'stall', N'G2', N'description', N'de', N'Mit verbundenen Augen den Zurufen folgen und den Tontopf zerschlagen.'),
  (N'stall', N'G2', N'price', N'zh', N'15,000 越南盾 / 次'),
  (N'stall', N'G2', N'price', N'ko', N'15,000동 / 1회'),
  (N'stall', N'G2', N'price', N'ja', N'15,000ドン / 1回'),
  (N'stall', N'G2', N'price', N'de', N'15.000 VND / Runde'),
  (N'stall', N'G3', N'description', N'zh', N'每队5人，每个整点开赛。'),
  (N'stall', N'G3', N'description', N'ko', N'5명이 한 팀이며 매시 정각에 경기가 열립니다.'),
  (N'stall', N'G3', N'description', N'ja', N'5人1チームで、毎正時に試合があります。'),
  (N'stall', N'G3', N'description', N'de', N'Teams zu je 5 Personen, Spiele zu jeder vollen Stunde.'),
  (N'stall', N'G4', N'description', N'zh', N'20米袋鼠跳比赛，每轮4人。'),
  (N'stall', N'G4', N'description', N'ko', N'20m 자루 뛰기 경주, 한 판에 4명.'),
  (N'stall', N'G4', N'description', N'ja', N'20メートルの袋跳び競走、1回4人です。'),
  (N'stall', N'G4', N'description', N'de', N'Ein 20-m-Sackhüpfen, 4 Spieler pro Runde.'),
  (N'stall', N'G5', N'description', N'zh', N'一种民间策略游戏，有人讲解规则。'),
  (N'stall', N'G5', N'description', N'ko', N'규칙을 알려 주는 안내원이 있는 민속 전략 놀이입니다.'),
  (N'stall', N'G5', N'description', N'ja', N'ルールを説明する係がいる、伝統的な戦略ゲームです。'),
  (N'stall', N'G5', N'description', N'de', N'Ein traditionelles Strategiespiel, jemand erklärt die Regeln.'),
  (N'stall', N'G6', N'description', N'zh', N'用球击倒易拉罐塔即可获奖。'),
  (N'stall', N'G6', N'description', N'ko', N'공으로 캔 탑을 쓰러뜨리면 상품을 받습니다.'),
  (N'stall', N'G6', N'description', N'ja', N'ボールで缶のタワーを倒すと景品がもらえます。'),
  (N'stall', N'G6', N'description', N'de', N'Wirf den Dosenturm mit einem Ball um und gewinne.'),
  (N'stall', N'G6', N'price', N'zh', N'20,000 越南盾 / 3 个球'),
  (N'stall', N'G6', N'price', N'ko', N'20,000동 / 공 3개'),
  (N'stall', N'G6', N'price', N'ja', N'20,000ドン / ボール3個'),
  (N'stall', N'G6', N'price', N'de', N'20.000 VND / 3 Bälle'),
  (N'stall', N'G7', N'description', N'zh', N'为10岁以下儿童准备的玩具钓鱼池。'),
  (N'stall', N'G7', N'description', N'ko', N'10세 미만 어린이를 위한 장난감 낚시터입니다.'),
  (N'stall', N'G7', N'description', N'ja', N'10歳未満のお子さま向けのおもちゃの釣り堀です。'),
  (N'stall', N'G7', N'description', N'de', N'Ein Spielzeug-Angelteich für Kinder unter 10 Jahren.'),
  (N'stall', N'G7', N'price', N'zh', N'25,000 越南盾 / 10 分钟'),
  (N'stall', N'G7', N'price', N'ko', N'25,000동 / 10분'),
  (N'stall', N'G7', N'price', N'ja', N'25,000ドン / 10分'),
  (N'stall', N'G7', N'price', N'de', N'25.000 VND / 10 Min.'),
  (N'stall', N'T1', N'description', N'zh', N'30分钟亲手做一盏纸灯笼并带回家。'),
  (N'stall', N'T1', N'description', N'ko', N'30분 동안 종이 등불을 만들어 가져갈 수 있습니다.'),
  (N'stall', N'T1', N'description', N'ja', N'30分で紙の提灯を作って持ち帰れます。'),
  (N'stall', N'T1', N'description', N'de', N'In 30 Minuten eine Papierlaterne basteln und mit nach Hause nehmen.'),
  (N'stall', N'T1', N'price', N'zh', N'50,000 越南盾 / 人'),
  (N'stall', N'T1', N'price', N'ko', N'50,000동 / 1인'),
  (N'stall', N'T1', N'price', N'ja', N'50,000ドン / 1人'),
  (N'stall', N'T1', N'price', N'de', N'50.000 VND / Person'),
  (N'stall', N'T2', N'description', N'zh', N'用木版和天然颜料印制民间画。'),
  (N'stall', N'T2', N'description', N'ko', N'나무판과 천연 물감으로 민화를 찍습니다.'),
  (N'stall', N'T2', N'description', N'ja', N'木版と天然の絵の具で民画を刷ります。'),
  (N'stall', N'T2', N'description', N'de', N'Ein Volksbild mit Holzstempeln und Naturfarben drucken.'),
  (N'stall', N'T2', N'price', N'zh', N'40,000 越南盾 / 张'),
  (N'stall', N'T2', N'price', N'ko', N'40,000동 / 1장'),
  (N'stall', N'T2', N'price', N'ja', N'40,000ドン / 1枚'),
  (N'stall', N'T2', N'price', N'de', N'40.000 VND / Bild'),
  (N'stall', N'T3', N'description', N'zh', N'枫叶拍照拱门，可现场打印照片。'),
  (N'stall', N'T3', N'description', N'ko', N'단풍잎 포토 아치에서 사진을 찍고 바로 인화할 수 있습니다.'),
  (N'stall', N'T3', N'description', N'ja', N'もみじの葉のフォトアーチ。その場で写真を印刷できます。'),
  (N'stall', N'T3', N'description', N'de', N'Ein Fotobogen aus Ahornblättern mit Sofortdruck.'),
  (N'stall', N'T3', N'price', N'zh', N'免费，打印照片 30,000 越南盾'),
  (N'stall', N'T3', N'price', N'ko', N'무료, 사진 인화 30,000동'),
  (N'stall', N'T3', N'price', N'ja', N'無料、写真印刷 30,000ドン'),
  (N'stall', N'T3', N'price', N'de', N'Kostenlos, Fotodruck 30.000 VND'),
  (N'stall', N'T4', N'description', N'zh', N'纪念品店，也是用集章兑换礼品的地方。'),
  (N'stall', N'T4', N'description', N'ko', N'기념품 가게이자 스탬프를 선물로 바꾸는 곳입니다.'),
  (N'stall', N'T4', N'description', N'ja', N'お土産の店で、スタンプを景品と交換する場所でもあります。'),
  (N'stall', N'T4', N'description', N'de', N'Souvenirs, und hier tauschst du deine Stempel gegen ein Geschenk.'),
  (N'stall', N'T4', N'price', N'zh', N'20,000 越南盾起'),
  (N'stall', N'T4', N'price', N'ko', N'20,000동부터'),
  (N'stall', N'T4', N'price', N'ja', N'20,000ドンから'),
  (N'stall', N'T4', N'price', N'de', N'Ab 20.000 VND'),
  (N'show', N'S1', N'description', N'zh', N'12人舞狮队伴着锣鼓为新的一天开场。'),
  (N'show', N'S1', N'description', N'ko', N'북과 징에 맞춘 12명의 사자춤이 하루를 엽니다.'),
  (N'show', N'S1', N'description', N'ja', N'太鼓と銅鑼に合わせた12人の獅子舞で一日が始まります。'),
  (N'show', N'S1', N'description', N'de', N'Eine 12-köpfige Löwentanzgruppe eröffnet mit Trommeln und Gongs den Tag.'),
  (N'show', N'S2', N'description', N'zh', N'独弦琴、筝和竹笛演奏越南三个地区的民歌。'),
  (N'show', N'S2', N'description', N'ko', N'단번, 단짠, 대나무 피리로 베트남 세 지역의 민요를 연주합니다.'),
  (N'show', N'S2', N'description', N'ja', N'一弦琴、ダンチャン、竹笛でベトナム三地方の民謡を演奏します。'),
  (N'show', N'S2', N'description', N'de', N'Einsaitige Zither, Zither und Bambusflöte spielen Volkslieder aus allen drei Regionen.'),
  (N'show', N'S3', N'description', N'zh', N'以秋叶的金、橙、棕色为主题的奥黛系列。'),
  (N'show', N'S3', N'description', N'ko', N'가을 낙엽의 금색, 주황색, 갈색을 담은 아오자이 컬렉션.'),
  (N'show', N'S3', N'description', N'ja', N'秋の葉の金色、オレンジ、茶色をテーマにしたアオザイコレクション。'),
  (N'show', N'S3', N'description', N'de', N'Eine Ao-Dai-Kollektion in den Gold-, Orange- und Brauntönen des Herbstlaubs.'),
  (N'show', N'S4', N'description', N'zh', N'不插电音乐演出，最后是环湖灯笼游行。'),
  (N'show', N'S4', N'description', N'ko', N'어쿠스틱 음악 공연 후 호수를 도는 등불 행렬로 마무리합니다.'),
  (N'show', N'S4', N'description', N'ja', N'アコースティック音楽のあと、湖を一周する提灯行列で締めくくります。'),
  (N'show', N'S4', N'description', N'de', N'Akustische Musik, zum Schluss ein Laternenumzug um den See.'),
  (N'stall', N'G3', N'price', N'zh', N'免费'),
  (N'stall', N'G3', N'price', N'ko', N'무료'),
  (N'stall', N'G3', N'price', N'ja', N'無料'),
  (N'stall', N'G3', N'price', N'de', N'Kostenlos'),
  (N'stall', N'G4', N'price', N'zh', N'免费'),
  (N'stall', N'G4', N'price', N'ko', N'무료'),
  (N'stall', N'G4', N'price', N'ja', N'無料'),
  (N'stall', N'G4', N'price', N'de', N'Kostenlos'),
  (N'stall', N'G5', N'price', N'zh', N'免费'),
  (N'stall', N'G5', N'price', N'ko', N'무료'),
  (N'stall', N'G5', N'price', N'ja', N'無料'),
  (N'stall', N'G5', N'price', N'de', N'Kostenlos')
) AS s (entity, entity_id, field, lang, text)
ON t.entity = s.entity AND t.entity_id = s.entity_id AND t.field = s.field AND t.lang = s.lang
WHEN NOT MATCHED THEN
  INSERT (entity, entity_id, field, lang, text, status) VALUES (s.entity, s.entity_id, s.field, s.lang, s.text, 'approved');
GO

/* Thuật ngữ mẫu (chỉ thêm từ chưa có). */
MERGE glossary_terms AS t
USING (VALUES
  (N'Mùa thu lộng lẫy', N'Tên lễ hội'),
  (N'cốm', N'Đặc sản mùa thu Hà Nội'),
  (N'áo dài', N'Trang phục truyền thống, giữ tên gốc'),
  (N'tranh Đông Hồ', N'Tranh dân gian'),
  (N'múa lân', N'Tiết mục mở màn'),
  (N'gian hàng', N'Dùng thống nhất một từ')
) AS s (term_vi, note)
ON t.term_vi = s.term_vi
WHEN NOT MATCHED THEN INSERT (term_vi, note) VALUES (s.term_vi, s.note);
GO
MERGE glossary_translations AS t
USING (SELECT g.id AS term_id, v.lang, v.text FROM (VALUES
  (N'Mùa thu lộng lẫy', N'en', N'Splendid Autumn'),
  (N'Mùa thu lộng lẫy', N'zh', N'灿烂金秋'),
  (N'Mùa thu lộng lẫy', N'ko', N'찬란한 가을'),
  (N'Mùa thu lộng lẫy', N'ja', N'華やかな秋'),
  (N'Mùa thu lộng lẫy', N'de', N'Prächtiger Herbst'),
  (N'cốm', N'en', N'com (green rice flakes)'),
  (N'cốm', N'zh', N'青米片'),
  (N'cốm', N'ko', N'꼼(풋쌀)'),
  (N'cốm', N'ja', N'コム（青米）'),
  (N'cốm', N'de', N'Com (grüne Reisflocken)'),
  (N'áo dài', N'en', N'ao dai'),
  (N'áo dài', N'zh', N'奥黛'),
  (N'áo dài', N'ko', N'아오자이'),
  (N'áo dài', N'ja', N'アオザイ'),
  (N'áo dài', N'de', N'Ao Dai'),
  (N'tranh Đông Hồ', N'en', N'Dong Ho folk painting'),
  (N'tranh Đông Hồ', N'zh', N'东湖民间画'),
  (N'tranh Đông Hồ', N'ko', N'동호 민화'),
  (N'tranh Đông Hồ', N'ja', N'ドンホー版画'),
  (N'tranh Đông Hồ', N'de', N'Dong-Ho-Volksbild'),
  (N'múa lân', N'en', N'lion dance'),
  (N'múa lân', N'zh', N'舞狮'),
  (N'múa lân', N'ko', N'사자춤'),
  (N'múa lân', N'ja', N'獅子舞'),
  (N'múa lân', N'de', N'Löwentanz'),
  (N'gian hàng', N'en', N'stall'),
  (N'gian hàng', N'zh', N'摊位'),
  (N'gian hàng', N'ko', N'부스'),
  (N'gian hàng', N'ja', N'屋台'),
  (N'gian hàng', N'de', N'Stand')
) AS v (term_vi, lang, text) JOIN glossary_terms g ON g.term_vi = v.term_vi) AS s
ON t.term_id = s.term_id AND t.lang = s.lang
WHEN NOT MATCHED THEN INSERT (term_id, lang, text) VALUES (s.term_id, s.lang, s.text);
GO


/* Tài khoản demo: admin@muathu.vn / muathu2026 (mật khẩu đã băm bằng bcrypt) */
INSERT INTO staff_users (email, password_hash, full_name, role) VALUES
  ('admin@muathu.vn', '$2b$10$RetRPZInKLI.yqY2lzctDOVbvgvcZ3Ov7BG4VblytPgLbxia2kKn.', N'Ban tổ chức', 'admin');

INSERT INTO announcements (text_vi, active) VALUES
  (N'Chương trình biểu diễn tối nay dời sang 19:45 do mưa.', 0);
GO

USE master;
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'mtll_app')
  CREATE LOGIN mtll_app WITH PASSWORD = 'MuaThu@2026', CHECK_POLICY = OFF, DEFAULT_DATABASE = MuaThuLongLay;
GO
USE MuaThuLongLay;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'mtll_app')
  CREATE USER mtll_app FOR LOGIN mtll_app;
ALTER ROLE db_datareader ADD MEMBER mtll_app;
ALTER ROLE db_datawriter ADD MEMBER mtll_app;
GO

/* Kiểm tra nhanh */
SELECT 'zones' AS bang, COUNT(*) AS so_dong FROM zones
UNION ALL SELECT 'stalls', COUNT(*) FROM stalls
UNION ALL SELECT 'shows', COUNT(*) FROM shows
UNION ALL SELECT 'translations', COUNT(*) FROM translations
UNION ALL SELECT 'staff_users', COUNT(*) FROM staff_users;
