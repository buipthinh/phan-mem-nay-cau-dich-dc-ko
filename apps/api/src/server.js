/**
 * API nối 2 trang web với SQL Server. Chạy: npm run dev (trong thư mục apps/api).
 *
 *   Web khách (điện thoại)  ─┐
 *                            ├─>  API này (cổng 3001)  ─>  SQL Server (database MuaThuLongLay)
 *   Web quản trị (laptop)   ─┘
 *
 * Trình duyệt không được nối thẳng vào SQL Server (sẽ lộ mật khẩu database), nên mọi việc đọc / ghi đi qua đây.
 * Mỗi đường dẫn có ghi chú UC tương ứng. Câu SQL luôn dùng tham số @ten để tránh lỗi SQL injection.
 */
import { randomUUID } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { compare } from 'bcryptjs';
import express from 'express';
import { getPool, query, sql } from './db.js';

const app = express();
app.use(express.json());

// Cho phép web (chạy ở cổng khác, ví dụ Vite 5173) gọi API này.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ---------------- UC09 Đăng nhập ban tổ chức ---------------- */

// Phiên đăng nhập lưu trong bộ nhớ: token -> email. Tắt API là phải đăng nhập lại.
const sessions = new Map();
const SESSION_MS = 12 * 60 * 60 * 1000;

/** UC09: kiểm tra email + mật khẩu với bảng staff_users, đúng thì cấp một mã phiên (token). */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const [user] = await query('select email, password_hash, full_name, role from staff_users where email = @email', {
    email: String(email ?? ''),
  });
  if (!user || !(await compare(String(password ?? ''), user.password_hash))) {
    return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
  }
  const token = randomUUID();
  sessions.set(token, { email: user.email, expires: Date.now() + SESSION_MS });
  res.json({ token, email: user.email, fullName: user.full_name, role: user.role });
});

app.post('/api/logout', (req, res) => {
  sessions.delete(bearer(req));
  res.sendStatus(204);
});

function bearer(req) {
  return req.get('Authorization')?.replace(/^Bearer /, '') ?? '';
}

/** Chặn các API sửa dữ liệu nếu chưa đăng nhập. */
function requireStaff(req, res, next) {
  const s = sessions.get(bearer(req));
  if (!s || s.expires < Date.now()) return res.status(401).json({ error: 'Chưa đăng nhập' });
  req.staff = s.email;
  next();
}

/* ---------------- Đọc nội dung (khách và ban tổ chức) ---------------- */

/**
 * Toàn bộ nội dung lễ hội, đúng dạng ContentRows trong packages/shared/src/db.ts
 * để web ghép lại bằng rowsToContent(). Khách chỉ thấy bản dịch đã duyệt.
 */
async function loadContent(includeDrafts) {
  const [zones, stalls, shows, translations, announcements] = await Promise.all([
    query('select id, kind, center_lat, center_lng, radius_m, map_x, map_y, map_w, map_h from zones'),
    query('select id, zone_id, kind, map_x, map_y, suggested from stalls'),
    // Kiểu TIME đổi sang chữ "HH:mm" để web dùng luôn.
    query('select id, slot, convert(varchar(5), starts_at, 108) as starts_at, convert(varchar(5), ends_at, 108) as ends_at from shows'),
    query(
      `select entity, entity_id, field, lang, text, status from translations
       where @all = 1 or status = 'approved' or lang = 'vi'`,
      { all: includeDrafts ? 1 : 0 },
    ),
    query('select top 1 id, text_vi, active from announcements order by id desc'),
  ]);
  return {
    zones: zones.map(({ map_x, map_y, map_w, map_h, ...z }) => ({ ...z, map_rect: [map_x, map_y, map_w, map_h] })),
    stalls,
    shows,
    translations,
    announcement: announcements[0] ?? null,
  };
}

app.get('/api/health', async (_req, res) => {
  await getPool();
  res.json({ ok: true });
});

/** UC01, UC02, UC05, UC06, UC16: web khách lấy toàn bộ nội dung (chỉ bản dịch đã duyệt). */
app.get('/api/content', async (_req, res) => res.json(await loadContent(false)));
/** UC11 đến UC14: web quản trị lấy toàn bộ nội dung, kể cả bản nháp. */
app.get('/api/admin/content', requireStaff, async (_req, res) => res.json(await loadContent(true)));

/* ---------------- Web khách ghi lại hoạt động (dùng cho UC10) ---------------- */

/** UC03, UC04: ghi 1 lượt quét QR / bấm nghe / đi vào khu vào visit_events. */
app.post('/api/visits', async (req, res) => {
  const { stallId = null, zoneId = null, lang, type, deviceId } = req.body ?? {};
  if (!['scan', 'play', 'zone_enter'].includes(type) || !lang || !deviceId) {
    return res.status(400).json({ error: 'Thiếu type, lang hoặc deviceId' });
  }
  await query('insert into visit_events (stall_id, zone_id, lang, type, device_id) values (@stallId, @zoneId, @lang, @type, @deviceId)', {
    stallId,
    zoneId,
    lang: String(lang),
    type,
    deviceId: String(deviceId).slice(0, 64),
  });
  res.sendStatus(201);
});

/**
 * UC10: web khách gọi mỗi 20 giây khi đang mở, để biết có bao nhiêu người đang truy cập.
 * Mỗi máy chỉ có 1 dòng 'visit' cho mỗi ngày: lần đầu trong ngày thì thêm dòng, các lần sau chỉ cập nhật last_seen_at.
 */
app.post('/api/presence', async (req, res) => {
  const { lang, deviceId } = req.body ?? {};
  if (!lang || !deviceId) return res.status(400).json({ error: 'Thiếu lang hoặc deviceId' });
  await query(
    // updlock + serializable khoá lại trong lúc kiểm tra, để 2 lần gọi cùng lúc không tạo 2 dòng 'visit' cho cùng một máy.
    `begin tran;
     update visit_events with (updlock, serializable) set last_seen_at = sysdatetime(), lang = @lang
       where type = 'visit' and device_id = @deviceId and cast(created_at as date) = cast(sysdatetime() as date);
     if @@rowcount = 0
       insert into visit_events (lang, type, device_id, last_seen_at) values (@lang, 'visit', @deviceId, sysdatetime());
     commit;`,
    { lang: String(lang), deviceId: String(deviceId).slice(0, 64) },
  );
  res.sendStatus(204);
});

/** Khách đóng trang: đánh dấu không còn truy cập ngay, không phải chờ hết 60 giây. */
app.post('/api/presence/leave', async (req, res) => {
  const { deviceId } = req.body ?? {};
  await query(
    `update visit_events set last_seen_at = dateadd(second, -120, sysdatetime())
       where type = 'visit' and device_id = @deviceId and cast(created_at as date) = cast(sysdatetime() as date)`,
    { deviceId: String(deviceId ?? '').slice(0, 64) },
  );
  res.sendStatus(204);
});

/* ---------------- Ban tổ chức sửa dữ liệu ---------------- */

/** UC11 Quản lý khu: sửa toạ độ GPS và bán kính (chữ của khu lưu qua /api/translations). */
app.put('/api/zones/:id', requireStaff, async (req, res) => {
  const z = req.body;
  await query(`update zones set center_lat = @lat, center_lng = @lng, radius_m = @radius where id = @id`, {
    id: req.params.id,
    lat: z.center_lat,
    lng: z.center_lng,
    radius: z.radius_m,
  });
  res.sendStatus(204);
});

/** UC12 Quản lý gian hàng: thêm mới hoặc sửa một gian (MERGE = có thì sửa, chưa có thì thêm). */
app.put('/api/stalls/:id', requireStaff, async (req, res) => {
  const s = req.body;
  await query(
    `merge stalls as t using (select @id as id) as src on t.id = src.id
     when matched then update set zone_id = @zone, kind = @kind, map_x = @x, map_y = @y, suggested = @suggested
     when not matched then insert (id, zone_id, kind, map_x, map_y, suggested) values (@id, @zone, @kind, @x, @y, @suggested);`,
    { id: req.params.id, zone: s.zone_id, kind: s.kind, x: s.map_x, y: s.map_y, suggested: s.suggested ? 1 : 0 },
  );
  res.sendStatus(204);
});

/** UC12: xoá gian. Xoá luôn bản dịch của gian, còn lịch sử lượt quét thì giữ lại nhưng bỏ liên kết. */
app.delete('/api/stalls/:id', requireStaff, async (req, res) => {
  const tx = new sql.Transaction(await getPool());
  await tx.begin();
  try {
    const id = req.params.id;
    await tx.request().input('id', id).query("delete from translations where entity = 'stall' and entity_id = @id");
    await tx.request().input('id', id).query('update visit_events set stall_id = null where stall_id = @id');
    await tx.request().input('id', id).query('delete from stalls where id = @id');
    await tx.commit();
    res.sendStatus(204);
  } catch (err) {
    await tx.rollback();
    throw err;
  }
});

/** UC14 Quản lý lịch diễn: đổi giờ của một suất diễn. */
app.put('/api/shows/:id', requireStaff, async (req, res) => {
  const s = req.body;
  await query('update shows set slot = @slot, starts_at = @start, ends_at = @end where id = @id', {
    id: req.params.id,
    slot: s.slot,
    start: s.starts_at,
    end: s.ends_at,
  });
  res.sendStatus(204);
});

/**
 * UC13 Dịch và duyệt: lưu nhiều bản dịch một lần (cả chữ tiếng Việt gốc của khu, gian, suất diễn).
 * Body là mảng { entity, entity_id, field, lang, text, status }. Dùng transaction: lỗi một dòng thì huỷ cả lô.
 */
app.put('/api/translations', requireStaff, async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  const tx = new sql.Transaction(await getPool());
  await tx.begin();
  try {
    for (const r of rows) {
      await tx
        .request()
        .input('entity', r.entity)
        .input('entityId', r.entity_id)
        .input('field', r.field)
        .input('lang', r.lang)
        .input('text', sql.NVarChar(sql.MAX), r.text)
        .input('status', r.status ?? 'draft')
        .query(
          `merge translations as t
           using (select @entity as entity, @entityId as entity_id, @field as field, @lang as lang) as s
           on t.entity = s.entity and t.entity_id = s.entity_id and t.field = s.field and t.lang = s.lang
           when matched then update set text = @text, status = @status, updated_at = sysdatetime()
           when not matched then insert (entity, entity_id, field, lang, text, status)
             values (@entity, @entityId, @field, @lang, @text, @status);`,
        );
    }
    await tx.commit();
    res.sendStatus(204);
  } catch (err) {
    await tx.rollback();
    throw err;
  }
});

/** UC16 Thông báo khẩn: mỗi lần lưu thêm một dòng mới, dòng mới nhất là thông báo đang dùng. */
app.put('/api/announcement', requireStaff, async (req, res) => {
  const { text_vi, active } = req.body ?? {};
  await query('insert into announcements (text_vi, active) values (@text, @active)', {
    text: String(text_vi ?? ''),
    active: active ? 1 : 0,
  });
  res.sendStatus(204);
});

/* ---------------- UC10 Thống kê cho trang Tổng quan ---------------- */

/** Một máy được tính là "đang truy cập" nếu đã báo còn mở trong 60 giây gần nhất. */
const ONLINE_SECONDS = 60;

app.get('/api/stats', requireStaff, async (_req, res) => {
  const [byStall, byLang, byHour, online, byDay] = await Promise.all([
    // Số lượt quét và lượt nghe của từng gian
    query(`select stall_id, sum(case when type = 'scan' then 1 else 0 end) as scans,
                  sum(case when type = 'play' then 1 else 0 end) as plays
           from visit_events where stall_id is not null group by stall_id order by scans desc`),
    // Khách dùng ngôn ngữ nào (tính theo số người truy cập)
    query("select lang, count(*) as total from visit_events where type = 'visit' group by lang"),
    // Lượt quét theo từng giờ trong ngày
    query(`select datepart(hour, created_at) as hour, count(*) as scans
           from visit_events where type = 'scan' group by datepart(hour, created_at) order by hour`),
    // Số máy đang mở web khách lúc này
    query(
      `select count(distinct device_id) as online from visit_events
       where type = 'visit' and last_seen_at > dateadd(second, -@sec, sysdatetime())`,
      { sec: ONLINE_SECONDS },
    ),
    // Số người truy cập theo từng ngày (mỗi máy 1 dòng 'visit' mỗi ngày)
    query(`select convert(varchar(10), created_at, 23) as day, count(distinct device_id) as visitors
           from visit_events where type = 'visit' group by convert(varchar(10), created_at, 23)`),
  ]);
  const totalScans = byStall.reduce((n, r) => n + r.scans, 0);
  const totalPlays = byStall.reduce((n, r) => n + r.plays, 0);
  const langTotal = byLang.reduce((n, r) => n + r.total, 0) || 1;
  res.json({
    byStall,
    byLang: byLang.map((r) => ({ lang: r.lang, share: r.total / langTotal })),
    byHour,
    totalScans,
    totalPlays,
    online: online[0]?.online ?? 0,
    visitorsByDay: byDay,
  });
});

/**
 * Địa chỉ IP của laptop trong mạng Wi‑Fi, để trang quản trị tạo sẵn mã QR dẫn tới web khách
 * (điện thoại không mở được "localhost", phải dùng IP của laptop).
 */
app.get('/api/network', (_req, res) => {
  const ips = Object.entries(networkInterfaces())
    // Bỏ card mạng ảo (VMware, VirtualBox, Hyper-V, WSL): điện thoại không vào được các IP này
    .filter(([name]) => !/vmware|virtualbox|vethernet|wsl|docker/i.test(name))
    .flatMap(([, list]) => list ?? [])
    .filter((n) => n.family === 'IPv4' && !n.internal)
    .map((n) => n.address)
    // Ưu tiên IP Wi‑Fi gia đình / trường học (192.168.x.x), sau đó 10.x.x.x
    .sort((a, b) => rank(a) - rank(b));
  res.json({ ips });
});

function rank(ip) {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  return 2;
}

/* ---------------- Lỗi chung ---------------- */

// Express 5 tự chuyển lỗi của hàm async xuống đây.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, '0.0.0.0', () => {
  console.log(`API chạy ở http://localhost:${port}  (thử mở http://localhost:${port}/api/health)`);
});
