-- Lược đồ dữ liệu lễ hội trên Supabase (Postgres), khớp với kiểu dữ liệu trong packages/shared/src/types.ts.
-- Chạy bằng: supabase db push   (hoặc dán vào SQL Editor của Supabase)

create table languages (
  code text primary key,            -- vi, en, zh, ko
  name text not null,
  is_active boolean not null default true
);

create table zones (
  id text primary key,              -- A, B, C, D, E
  kind text not null check (kind in ('food', 'game', 'craft', 'stage', 'plaza')),
  center_lat double precision not null,
  center_lng double precision not null,
  radius_m integer not null check (radius_m between 10 and 200),
  map_rect integer[] not null       -- [x, y, rộng, cao] trên bản đồ vẽ 800 x 540
);

create table stalls (
  id text primary key,              -- F1, G3, T2 (in trên mã QR)
  zone_id text not null references zones (id),
  kind text not null check (kind in ('food', 'game', 'craft')),
  map_x integer not null,
  map_y integer not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table shows (
  id text primary key,
  slot text not null check (slot in ('morning', 'noon', 'afternoon', 'evening')),
  starts_at time not null,
  ends_at time not null check (ends_at > starts_at)
);

-- Một bảng dịch chung cho mọi nội dung: (loại, mã, trường, ngôn ngữ) -> chữ.
create table translations (
  entity text not null check (entity in ('zone', 'stall', 'show')),
  entity_id text not null,
  field text not null,              -- name, description, narration, price, allergens
  lang text not null references languages (code),
  text text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'outdated')),
  audio_url text,
  updated_at timestamptz not null default now(),
  primary key (entity, entity_id, field, lang)
);

create table announcements (
  id bigint generated always as identity primary key,
  text_vi text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table visit_events (
  id bigint generated always as identity primary key,
  stall_id text references stalls (id),
  zone_id text references zones (id),
  lang text not null,
  type text not null check (type in ('scan', 'play', 'zone_enter')),
  device_id text not null,
  created_at timestamptz not null default now()
);

-- Quyền truy cập: khách (anon) chỉ đọc nội dung đã duyệt và ghi lượt quét; nhân viên đăng nhập được sửa tất cả.
alter table languages enable row level security;
alter table zones enable row level security;
alter table stalls enable row level security;
alter table shows enable row level security;
alter table translations enable row level security;
alter table announcements enable row level security;
alter table visit_events enable row level security;

create policy "public read" on languages for select using (true);
create policy "public read" on zones for select using (true);
create policy "public read" on stalls for select using (true);
create policy "public read" on shows for select using (true);
create policy "public read approved" on translations for select using (status = 'approved' or lang = 'vi');
create policy "public read active" on announcements for select using (active);
create policy "public insert" on visit_events for insert with check (true);

create policy "staff all" on zones for all to authenticated using (true) with check (true);
create policy "staff all" on stalls for all to authenticated using (true) with check (true);
create policy "staff all" on shows for all to authenticated using (true) with check (true);
create policy "staff all" on translations for all to authenticated using (true) with check (true);
create policy "staff all" on announcements for all to authenticated using (true) with check (true);
create policy "staff read" on visit_events for select to authenticated using (true);

insert into languages (code, name) values ('vi', 'Tiếng Việt'), ('en', 'English'), ('zh', '中文'), ('ko', '한국어');
