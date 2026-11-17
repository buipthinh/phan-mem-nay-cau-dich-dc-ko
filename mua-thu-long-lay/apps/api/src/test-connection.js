// Chạy: npm run test-db   (trong thư mục apps/api)
import { getPool, query } from './db.js';

try {
  await getPool();
  const rows = await query(`
    select 'zones' as bang, count(*) as so_dong from zones
    union all select 'stalls', count(*) from stalls
    union all select 'shows', count(*) from shows
    union all select 'translations', count(*) from translations
    union all select 'staff_users', count(*) from staff_users`);
  console.log('Kết nối SQL Server thành công!');
  console.table(rows);
  process.exit(0);
} catch (err) {
  console.error('Không kết nối được SQL Server:', err.message);
  console.error('Xem mục "Sửa lỗi thường gặp" trong apps/api/README.md');
  process.exit(1);
}
