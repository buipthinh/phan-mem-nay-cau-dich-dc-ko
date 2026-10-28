/* =====================================================================
   CSDL "Mùa thu lộng lẫy" cho SQL Server (mở bằng SSMS, bấm Execute / F5)
   Dùng chung cho: web quản trị (ban tổ chức) và web mobile (khách quét QR)
   Chữ tiếng Việt, Trung, Hàn, Nhật -> dùng NVARCHAR và chuỗi có chữ N phía trước.
   ===================================================================== */
IF DB_ID(N'MuaThuLongLay') IS NULL CREATE DATABASE MuaThuLongLay;
GO
USE MuaThuLongLay;
GO

/* Xoá bảng cũ nếu chạy lại script (xoá bảng con trước, bảng cha sau) */
DROP TABLE IF EXISTS visit_events, translations, announcements, stalls, shows, zones, languages, staff_users;
GO

/* UC01 Chọn ngôn ngữ: các ngôn ngữ khách được chọn trên web khách. */
CREATE TABLE languages (
  code      VARCHAR(5)    PRIMARY KEY,          -- vi, en, zh, ko, ja, de
  name      NVARCHAR(50)  NOT NULL,
  is_active BIT           NOT NULL DEFAULT 1
);

/* UC02, UC03, UC11: các khu của lễ hội. Toạ độ GPS + bán kính dùng để biết khách đang ở khu nào
   và tự đọc thuyết minh; map_x..map_h là vị trí khu trên bản đồ vẽ. */
CREATE TABLE zones (
  id         VARCHAR(10)  PRIMARY KEY,           -- A, B, C, D, E
  kind       VARCHAR(10)  NOT NULL CHECK (kind IN ('food','game','craft','stage','plaza')),
  center_lat FLOAT        NOT NULL,              -- toạ độ GPS tâm khu
  center_lng FLOAT        NOT NULL,
  radius_m   INT          NOT NULL CHECK (radius_m BETWEEN 10 AND 200),
  map_x INT NOT NULL, map_y INT NOT NULL,        -- hình chữ nhật của khu trên bản đồ 800 x 540
  map_w INT NOT NULL, map_h INT NOT NULL
);

/* UC04, UC05, UC12, UC15: các gian hàng. Mã gian (F1, G3...) cũng là nội dung in trong mã QR. */
CREATE TABLE stalls (
  id         VARCHAR(10)  PRIMARY KEY,           -- F1, G3, T2 (mã in trên QR)
  zone_id    VARCHAR(10)  NOT NULL REFERENCES zones(id),
  kind       VARCHAR(10)  NOT NULL CHECK (kind IN ('food','game','craft')),
  map_x      INT          NOT NULL,
  map_y      INT          NOT NULL,
  suggested  BIT          NOT NULL DEFAULT 0,    -- gian "nên ghé"
  image_url  NVARCHAR(500) NULL,
  created_at DATETIME2    NOT NULL DEFAULT SYSDATETIME()
);

/* UC06, UC14: lịch diễn, lặp lại mỗi ngày lễ hội. */
CREATE TABLE shows (
  id        VARCHAR(10)  PRIMARY KEY,
  slot      VARCHAR(10)  NOT NULL CHECK (slot IN ('morning','noon','afternoon','evening')),
  starts_at TIME(0)      NOT NULL,
  ends_at   TIME(0)      NOT NULL,
  CONSTRAINT ck_shows_time CHECK (ends_at > starts_at)
);

/* UC13 Dịch và duyệt bản dịch: một bảng dịch chung cho khu, gian và suất diễn.
   Một dòng = (loại nội dung, mã, trường, ngôn ngữ) -> chữ + trạng thái.
   Web khách chỉ đọc bản 'approved' (đã duyệt) và bản tiếng Việt gốc. */
CREATE TABLE translations (
  entity     VARCHAR(10)   NOT NULL CHECK (entity IN ('zone','stall','show')),
  entity_id  VARCHAR(10)   NOT NULL,
  field      VARCHAR(20)   NOT NULL,           -- name, label, description, narration, price, allergens
  lang       VARCHAR(5)    NOT NULL REFERENCES languages(code),
  text       NVARCHAR(MAX) NOT NULL,
  status     VARCHAR(10)   NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','outdated')),
  updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT pk_translations PRIMARY KEY (entity, entity_id, field, lang)
);

/* UC16 Thông báo khẩn: dòng mới nhất là thông báo đang dùng; active = 1 thì web khách hiện dải thông báo. */
CREATE TABLE announcements (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  text_vi    NVARCHAR(500) NOT NULL,
  active     BIT           NOT NULL DEFAULT 0,
  created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);

/* UC10 Tổng quan thống kê. Bảng bắt đầu rỗng (0 lượt), mỗi hành động của khách thêm 1 dòng:
     - 'visit'      : khách mở web khách. Mỗi máy chỉ có 1 dòng 'visit' cho mỗi ngày, nên đếm số dòng
                      'visit' theo ngày là ra số người truy cập ngày đó (ngày 1, ngày 2 của lễ hội).
                      Trang khách báo "còn đang mở" mỗi 20 giây bằng cách cập nhật last_seen_at,
                      nên máy nào có last_seen_at trong 60 giây gần nhất là đang truy cập.
     - 'scan'       : khách quét QR một gian (UC04)
     - 'play'       : khách bấm nghe thuyết minh (UC03)
     - 'zone_enter' : khách đi vào một khu (UC02, UC03) */
CREATE TABLE visit_events (
  id           BIGINT IDENTITY(1,1) PRIMARY KEY,
  stall_id     VARCHAR(10)  NULL REFERENCES stalls(id),
  zone_id      VARCHAR(10)  NULL REFERENCES zones(id),
  lang         VARCHAR(5)   NOT NULL,
  type         VARCHAR(12)  NOT NULL CHECK (type IN ('visit','scan','play','zone_enter')),
  device_id    VARCHAR(64)  NOT NULL,            -- mã ngẫu nhiên lưu trong trình duyệt của khách
  created_at   DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
  last_seen_at DATETIME2    NULL                 -- chỉ dùng cho dòng 'visit': lần cuối trang khách báo còn mở
);
CREATE INDEX ix_visit_time ON visit_events(created_at);
CREATE INDEX ix_visit_device ON visit_events(type, device_id, created_at);

/* UC09 Đăng nhập: tài khoản ban tổ chức. Mật khẩu lưu dạng băm (bcrypt), KHÔNG lưu mật khẩu thật. */
CREATE TABLE staff_users (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  email         VARCHAR(200)  NOT NULL UNIQUE,
  password_hash VARCHAR(200)  NOT NULL,
  full_name     NVARCHAR(100) NOT NULL,
  role          VARCHAR(10)   NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor'))
);
GO

/* ------------------------- Dữ liệu mẫu ------------------------- */
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

INSERT INTO stalls (id, zone_id, kind, map_x, map_y, suggested) VALUES
  (N'F1', N'A', N'food', 85, 320, 0),
  (N'F2', N'A', N'food', 175, 320, 0),
  (N'F3', N'A', N'food', 265, 320, 0),
  (N'F4', N'A', N'food', 120, 420, 0),
  (N'F5', N'A', N'food', 230, 420, 0),
  (N'G1', N'B', N'game', 540, 290, 0),
  (N'G2', N'B', N'game', 625, 290, 0),
  (N'G3', N'B', N'game', 710, 290, 0),
  (N'G4', N'B', N'game', 540, 365, 0),
  (N'G5', N'B', N'game', 625, 365, 0),
  (N'G6', N'B', N'game', 710, 365, 0),
  (N'G7', N'B', N'game', 625, 435, 0),
  (N'T1', N'C', N'craft', 85, 110, 1),
  (N'T2', N'C', N'craft', 175, 110, 1),
  (N'T3', N'C', N'craft', 265, 110, 1),
  (N'T4', N'C', N'craft', 175, 195, 1);
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

/* Tài khoản demo: admin@muathu.vn / muathu2026 (mật khẩu đã băm bằng bcrypt) */
INSERT INTO staff_users (email, password_hash, full_name, role) VALUES
  ('admin@muathu.vn', '$2b$10$RetRPZInKLI.yqY2lzctDOVbvgvcZ3Ov7BG4VblytPgLbxia2kKn.', N'Ban tổ chức', 'admin');

INSERT INTO announcements (text_vi, active) VALUES
  (N'Chương trình biểu diễn tối nay dời sang 19:45 do mưa.', 0);
GO

/* Tài khoản để API Node đăng nhập SQL Server (khớp DB_USER / DB_PASSWORD trong apps/api/.env).
   Chỉ được đọc / ghi dữ liệu, không được xoá bảng. */
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
