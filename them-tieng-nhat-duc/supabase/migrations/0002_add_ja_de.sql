-- Thêm tiếng Nhật và tiếng Đức, nâng tổng số ngôn ngữ lên 6.
insert into languages (code, name) values ('ja', '日本語'), ('de', 'Deutsch')
on conflict (code) do nothing;
